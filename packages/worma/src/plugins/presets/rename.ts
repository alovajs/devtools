import type { ApiDescriptor, ApiPlugin, Parameter } from '@/type'
import { ParameterIn, PluginName, RenameScope } from '@/constant'
import { extend, isMatch } from './utils'
/**
 * Rename style options
 */
export type RenameStyle = 'camelCase' | 'kebabCase' | 'snakeCase' | 'pascalCase'

/**
 * Rename plugin configuration
 */
export interface RenameConfig {
  /**
   * Target scope for renaming, defaults to 'url'
   */
  scope?: 'url' | 'params' | 'pathParams' | 'data' | 'response' | 'refName' | 'name'

  /**
   * Matching rule for selective renaming:
   * - string: target contains this string
   * - RegExp: target matches this pattern
   * - function: custom matching logic
   * If not specified, all targets will be processed
   */
  match?: string | RegExp | ((key: string, level?: number) => boolean)

  /**
   * Naming style to apply
   */
  style?: RenameStyle

  /**
   * Custom transformation function
   * Will be applied before style transformation
   */
  transform?: (apiDescriptor: ApiDescriptor, value: string) => string
}

function toCamelCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^(.)/, c => c.toLowerCase())
}

function toCase(str: string): string {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
}

function toPascalCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^(.)/, c => c.toUpperCase())
}

/**
 * Applies renaming rules to the specified value
 * @returns The renamed value, or original value if not matched
 */
function applyRenameRule(value: string, config: RenameConfig, apiDescriptor: ApiDescriptor, level = 0): string {
  // Skip non-string values (e.g. a missing or empty operationId) to avoid runtime errors
  if (typeof value !== 'string') {
    return value
  }

  if (!isMatch(value, config.match, level)) {
    return value
  }

  if (config.transform) {
    value = config.transform(apiDescriptor, value)
  }

  if (!config.style) {
    return value
  }
  if (config.style === 'kebabCase' && config.scope === 'refName') {
    throw new Error(`Invalid rename style: ${config.style}, ${config.scope}`)
  }
  switch (config.style) {
    case 'camelCase':
      return toCamelCase(value)
    case 'snakeCase':
      return toCase(value)
    case 'kebabCase':
      return toKebabCase(value)
    case 'pascalCase':
      return toPascalCase(value)
    default:
      throw new Error(`Invalid rename style: ${config.style}`)
  }
}

/**
 * Validates that no duplicate names exist after renaming.
 * Throws an error with details if duplicates are found within the same scope.
 *
 * @param names the renamed names to check for duplicates
 * @param scopeLabel used to identify the scope in the error message
 * @param apiDescriptor the API descriptor the names belong to
 * @param originalNames optional, the original keys before renaming (same order
 *   as `names`). When provided, the error message also lists which original keys
 *   were mapped to each duplicated name, making the conflict easier to locate.
 */
function assertNoDuplicates(
  names: string[],
  scopeLabel: string,
  apiDescriptor: ApiDescriptor,
  originalNames?: string[],
): void {
  if (!names || names.length === 0)
    return

  const counts = new Map<string, number>()
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name)

  if (duplicates.length === 0)
    return

  // When original keys are available, group them by the duplicated (renamed) name
  // so users can see exactly which keys collided.
  let detail = ''
  if (originalNames && originalNames.length === names.length) {
    const grouped = new Map<string, string[]>()
    for (let i = 0; i < names.length; i++) {
      if (duplicates.includes(names[i])) {
        const list = grouped.get(names[i]) ?? []
        list.push(originalNames[i])
        grouped.set(names[i], list)
      }
    }
    detail = [...grouped.entries()]
      .map(([renamed, originals]) => `    ${renamed} <- [${originals.join(', ')}]`)
      .join('\n')
  }
  else {
    detail = `    ${duplicates.join(', ')}`
  }

  const method = apiDescriptor.method ? String(apiDescriptor.method).toUpperCase() : ''
  const url = apiDescriptor.url ?? ''
  throw new Error(
    `[rename] Duplicate names found after renaming (scope=${scopeLabel}):\n`
    + `  Conflicting (renamed) keys and their original keys:\n`
    + `${detail}\n`
    + `  Reason: different original names were mapped to the same name after `
    + `match/transform/style processing, which would cause naming conflicts or `
    + `missing references in the generated code.\n`
    + `  Please adjust the rename config to avoid mapping multiple names to the same result.\n`
    + `  API: ${method} ${url}`,
  )
}

/**
 * renames URL path by processing each segment individually
 * while keeping path parameter placeholders
 */
function renameUrl(url: string, config: RenameConfig, apiDescriptor: ApiDescriptor): string {
  const segments = url.split('/')
  return segments
    .map((segment) => {
      // Skip parameter placeholders and empty segments
      if ((segment.startsWith('{') && segment.endsWith('}')) || !segment) {
        return segment
      }
      return applyRenameRule(segment, config, apiDescriptor, 0)
    })
    .join('/')
    .replace(/^\/{2,}/g, '/')
}

/**
 * Recursively processes a schema (supports nested objects and arrays),
 * applying property renaming to nested objects.
 * @param schema current schema
 * @param level current nesting level (starts from 0)
 * @param scopeLabel used to identify the scope in duplicate-name errors
 */
function transformSchema(
  schema: any,
  config: RenameConfig,
  apiDescriptor: ApiDescriptor,
  level: number,
  scopeLabel: string,
): any {
  if (!schema || typeof schema !== 'object')
    return schema

  // Nested object: recursively process its properties
  if ('properties' in schema && schema.properties) {
    return transformProperties(schema, config, apiDescriptor, level, scopeLabel)
  }

  // Array: recursively process items (supports a single schema or an array of schemas)
  if (schema.items && typeof schema.items === 'object') {
    if (Array.isArray(schema.items)) {
      return {
        ...schema,
        items: schema.items.map((item: any) => transformSchema(item, config, apiDescriptor, level, scopeLabel)),
      }
    }
    return {
      ...schema,
      items: transformSchema(schema.items, config, apiDescriptor, level, scopeLabel),
    }
  }

  return schema
}

/**
 * Transforms object properties using the renaming rules (supports deep recursive renaming)
 * @param level current nesting level (starts from 0), passed through to the match function
 * @param scopeLabel used to identify the scope in duplicate-name errors
 */
function transformProperties(
  obj: Record<string, any>,
  config: RenameConfig,
  apiDescriptor: ApiDescriptor,
  level = 0,
  scopeLabel: string = (config.scope as string) ?? 'data',
): Record<string, any> {
  if (!obj || typeof obj !== 'object' || !('properties' in obj) || !obj.properties) {
    return obj
  }

  const properties = obj.properties
  const newProperties: Record<string, any> = {}
  const newKeys: string[] = []
  // Record the oldKey -> newKey mapping, used to keep the same-level required array in sync
  const keyMap = new Map<string, string>()

  for (const key in properties) {
    const newKey = applyRenameRule(key, config, apiDescriptor, level)
    newKeys.push(newKey)
    keyMap.set(key, newKey)
    newProperties[newKey] = transformSchema(properties[key], config, apiDescriptor, level + 1, scopeLabel)
  }

  // Duplicate property names within the same object level would overwrite each other, so report an error
  assertNoDuplicates(newKeys, scopeLabel, apiDescriptor, Object.keys(properties))

  // Keep the required array of the current level in sync with the renamed property names;
  // otherwise the generator would crash during normalization because required references a non-existent property
  let newRequired = obj.required
  if (Array.isArray(newRequired)) {
    newRequired = newRequired.map((r: string) => keyMap.get(r) ?? r)
  }

  return {
    ...obj,
    properties: newProperties,
    ...(newRequired !== obj.required ? { required: newRequired } : {}),
  }
}

/**
 * Transforms parameters of specific type using the renaming rules
 */
function transformParameters(
  parameters: Array<Parameter>,
  type: 'query' | 'path' | 'header' | 'cookie',
  config: RenameConfig,
  apiDescriptor: ApiDescriptor,
): Array<Parameter> {
  if (!parameters || !Array.isArray(parameters)) {
    return parameters
  }

  return parameters.map((param) => {
    if (param.in === type) {
      return {
        ...param,
        name: applyRenameRule(param.name, config, apiDescriptor, 0),
      }
    }
    return param
  })
}
function transformRefNameMap(refNameMap: Record<string, string>, config: RenameConfig, apiDescriptor: ApiDescriptor): Record<string, string> {
  if (!refNameMap || typeof refNameMap !== 'object') {
    return refNameMap
  }

  const newRefNameMap: Record<string, string> = {}
  const newValues: string[] = []
  for (const key in refNameMap) {
    const newValue = applyRenameRule(refNameMap[key], config, apiDescriptor, 0)
    newValues.push(newValue)
    newRefNameMap[key] = newValue
  }

  // Different $refs mapping to the same type name would generate duplicate interfaces, so report an error
  assertNoDuplicates(newValues, 'refName', apiDescriptor, Object.keys(refNameMap))

  return newRefNameMap
}
/**
 * Processes API descriptor based on renaming configuration
 *
 * Each scope targets different parts of the API descriptor:
 * - url: Renames URL path segments
 * - params: Renames query parameters
 * - pathParams: Renames path parameters and their placeholders in URL
 * - data: Renames request body properties
 * - response: Renames response body properties
 * - name: Renames the generated API function name (operationId)
 */
function renameApiDescriptor(apiDescriptor: ApiDescriptor, config: RenameConfig): ApiDescriptor {
  if (!apiDescriptor)
    return apiDescriptor

  const newDescriptor = { ...apiDescriptor }
  const scope = config.scope || RenameScope.URL

  switch (scope) {
    case RenameScope.PARAMS:
      if (newDescriptor.parameters) {
        const originalParams = newDescriptor.parameters.filter(p => p.in === ParameterIn.QUERY).map(p => p.name)
        newDescriptor.parameters = transformParameters(newDescriptor.parameters, ParameterIn.QUERY, config, apiDescriptor)
        // Duplicate query parameter names would be indistinguishable when calling the API, so report an error
        assertNoDuplicates(
          newDescriptor.parameters.filter(p => p.in === ParameterIn.QUERY).map(p => p.name),
          'params',
          apiDescriptor,
          originalParams,
        )
      }
      break

    case RenameScope.PATH_PARAMS:
      if (newDescriptor.parameters) {
        const originalParams = newDescriptor.parameters.filter(p => p.in === ParameterIn.PATH).map(p => p.name)
        newDescriptor.parameters = transformParameters(newDescriptor.parameters, ParameterIn.PATH, config, apiDescriptor)

        if (newDescriptor.url) {
          newDescriptor.url = newDescriptor.url.replace(/\{([^}]+)\}/g, (match, paramName) => {
            const newName = applyRenameRule(paramName, config, apiDescriptor, 0)
            return `{${newName}}`
          })
        }

        // Duplicate path parameter names would make URL placeholders no longer match the parameters, so report an error
        assertNoDuplicates(
          (newDescriptor.parameters ?? []).filter(p => p.in === ParameterIn.PATH).map(p => p.name),
          'pathParams',
          apiDescriptor,
          originalParams,
        )
      }
      break

    case RenameScope.DATA:
      if (newDescriptor.requestBody) {
        newDescriptor.requestBody = transformProperties(newDescriptor.requestBody, config, apiDescriptor, 0, 'data')
      }
      break

    case RenameScope.RESPONSE:
      if (newDescriptor.responses) {
        newDescriptor.responses = transformProperties(newDescriptor.responses, config, apiDescriptor, 0, 'response')
      }
      break

    case RenameScope.URL:
      if (newDescriptor.url) {
        const originalUrlNames = newDescriptor.url
          .split('/')
          .filter(Boolean)
          .map(segment => (segment.startsWith('{') && segment.endsWith('}') ? segment.slice(1, -1) : segment))
        newDescriptor.url = renameUrl(newDescriptor.url, config, apiDescriptor)
        // Duplicate path segments would make the URL unable to distinguish different resources, so report an error
        const urlNames = newDescriptor.url
          .split('/')
          .filter(Boolean)
          .map(segment => (segment.startsWith('{') && segment.endsWith('}') ? segment.slice(1, -1) : segment))
        assertNoDuplicates(urlNames, 'url', apiDescriptor, originalUrlNames)
      }
      break
    case RenameScope.REF_NAME:
      if (newDescriptor.refNameMap) {
        newDescriptor.refNameMap = transformRefNameMap(newDescriptor.refNameMap, config, apiDescriptor)
      }
      break
    case RenameScope.NAME:
      if (newDescriptor.operationId != null) {
        newDescriptor.operationId = applyRenameRule(newDescriptor.operationId, config, apiDescriptor, 0)
      }
      break
    default:
      // No action needed, keep original descriptor
      break
  }

  return newDescriptor
}

/**
 * Creates a rename plugin that transforms API descriptors
 * according to specified naming rules
 */
export function rename(config: RenameConfig | RenameConfig[]): ApiPlugin {
  const configs = Array.isArray(config) ? config : [config]

  for (const conf of configs) {
    if (!conf.style && !conf.transform) {
      throw new Error('at least one of `style` or `transform` is required')
    }
    if (conf.style === 'kebabCase' && conf.scope === 'refName') {
      throw new Error(`Invalid rename style: ${conf.style}, ${conf.scope}`)
    }
  }

  return {
    name: PluginName.RENAME,
    config({ config }) {
      return extend(config, {
        handleApi: (apiDescriptor: ApiDescriptor) => {
          if (!apiDescriptor)
            return null

          // Apply each configuration in sequence
          return configs.reduce<ApiDescriptor | null>((desc, conf) => {
            if (!desc)
              return null
            return renameApiDescriptor(desc, conf)
          }, apiDescriptor)
        },
      })
    },
  }
}

export default rename
