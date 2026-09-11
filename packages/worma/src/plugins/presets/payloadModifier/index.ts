import type { PatchResult } from './patch'
import type { Matcher, PayloadModifierConfig } from './type'
import type { ApiDescriptor, ApiPlugin, SchemaObject } from '@/type'
import { PluginName } from '@/constant'
import { logger } from '@/helper/logger'
import { extend, isMatch } from '../utils'
import { stripRef } from './dsl'
import { applyFieldValue } from './patch'
import { getScopeSchema, setScopeSchema } from './scope'

export type {
  FieldPatchObject,
  FieldTable,
  FieldValue,
  Matcher,
  ModifierConfig,
  ModifierScope,
  PayloadModifierConfig,
  SchemaDSL,
  SchemaPrimitive,
} from './type'

const LOG_TAG = '[payloadModifier]'

/** Tests a value against one or more rules. No rule given = everything matches. */
function matchRule(value: string, rule?: Matcher | Matcher[]): boolean {
  if (rule === undefined) {
    return true
  }
  const rules = Array.isArray(rule) ? rule : [rule]
  return rules.some(item => isMatch(value, item))
}

/** Tag dimension: any tag hitting any rule makes the config apply. */
function matchTags(tags: string[] | undefined, rule?: Matcher | Matcher[]): boolean {
  if (rule === undefined) {
    return true
  }
  if (!Array.isArray(tags) || tags.length === 0) {
    return false
  }
  return tags.some(tag => matchRule(tag, rule))
}

/** Interface filters are ANDed together. */
function matchApi(apiDescriptor: ApiDescriptor, config: PayloadModifierConfig): boolean {
  return matchRule(apiDescriptor.url ?? '', config.path)
    && matchTags(apiDescriptor.tags, config.tag)
}

/**
 * Navigates an unwrap path. Only `properties` is followed, so array items are out of
 * reach by design — use `handler` for those. Returns `undefined` when a segment is missing.
 */
function unwrapSchema(root: SchemaObject, path: string): SchemaObject | undefined {
  let node: SchemaObject | undefined = root
  for (const segment of path.split('.')) {
    if (!node || !node.properties) {
      return undefined
    }
    node = (node.properties as Record<string, SchemaObject>)[segment]
  }
  return node
}

/** Runs patch then handler on a single located node. */
function applyStages(
  node: SchemaObject,
  key: string | undefined,
  config: PayloadModifierConfig,
  warn: (message: string) => void,
): PatchResult {
  let result: PatchResult = { schema: node }

  if ('patch' in config) {
    result = applyFieldValue(node, config.patch!, { warn })
    if (!result.schema) {
      return result
    }
  }

  if (config.handler) {
    const handled = config.handler(result.schema as SchemaObject, key)
    return { schema: handled ? stripRef(handled) : null, required: result.required }
  }

  return result
}

function applyConfig(apiDescriptor: ApiDescriptor, config: PayloadModifierConfig): ApiDescriptor {
  if (!apiDescriptor || !matchApi(apiDescriptor, config)) {
    return apiDescriptor
  }

  const warn = (message: string) => logger.warn(`${LOG_TAG} ${message}`)
  const root = getScopeSchema(apiDescriptor, config.scope)
  if (!root) {
    return apiDescriptor
  }

  // 1. redirect: the scope root itself is replaced before anything else runs
  let located: SchemaObject = root
  if (config.unwrap !== undefined) {
    const unwrapped = unwrapSchema(root, config.unwrap)
    if (!unwrapped) {
      warn(`unwrap "${config.unwrap}" does not exist in scope "${config.scope}" of ${apiDescriptor.url}, config skipped`)
      return apiDescriptor
    }
    located = stripRef(unwrapped)
  }

  // 2. locate: either the root itself or every matching top-level field
  if (config.match === undefined) {
    const { schema } = applyStages(located, undefined, config, warn)
    const next: ApiDescriptor = { ...apiDescriptor }
    setScopeSchema(next, config.scope, schema)
    return next
  }

  const keys = Object.keys(located.properties ?? {}).filter(key => isMatch(key, config.match!))
  if (!keys.length) {
    return apiDescriptor
  }

  const properties: Record<string, SchemaObject> = { ...(located.properties ?? {}) } as Record<string, SchemaObject>
  const required = new Set<string>(Array.isArray(located.required) ? located.required as string[] : [])
  for (const key of keys) {
    const result = applyStages(properties[key], key, config, warn)
    if (!result.schema) {
      delete properties[key]
      required.delete(key)
      continue
    }
    properties[key] = result.schema
    if (result.required ?? required.has(key)) {
      required.add(key)
    }
    else {
      required.delete(key)
    }
  }

  const next: ApiDescriptor = { ...apiDescriptor }
  setScopeSchema(next, config.scope, {
    ...located,
    properties,
    required: Array.from(required),
  } as SchemaObject)
  return next
}

/**
 * Flexibly adds, deletes and modifies the payload of your APIs.
 *
 * Every config runs the same fixed pipeline: interface filter (`path` / `tag`) → redirect
 * (`unwrap`) → locate (`match`) → patch (`patch`) → custom (`handler`). Configs are applied
 * in array order, so a later config sees the result of the previous ones.
 *
 * @example
 * ```ts
 * payloadModifier([
 *   { scope: 'response', unwrap: 'data' },
 *   { scope: 'response', match: /[Ii]d$/, patch: 'string' },
 *   { scope: 'data', path: '/planPoint', patch: { operatorId: { type: 'string', required: true } } },
 * ])
 * ```
 */
export function payloadModifier(configs: PayloadModifierConfig[]): ApiPlugin {
  // Guards against the config hook being run twice for the same descriptor,
  // which happens when the CLI loads the same plugin instance more than once.
  const processed = Symbol('worma:payloadModifier:processed')
  const list = Array.isArray(configs) ? configs : [configs]

  return {
    name: PluginName.PAYLOAD_MODIFIER,
    config({ config }) {
      return extend(config, {
        handleApi: (apiDescriptor: ApiDescriptor) => {
          if (!apiDescriptor) {
            return null
          }
          if ((apiDescriptor as Record<symbol, unknown>)[processed]) {
            return apiDescriptor
          }
          const next = list.reduce<ApiDescriptor | null>(
            (descriptor, conf) => (descriptor ? applyConfig(descriptor, conf) : null),
            apiDescriptor,
          )
          if (next) {
            (next as Record<symbol, unknown>)[processed] = true
          }
          return next
        },
      })
    },
  }
}

export default payloadModifier
