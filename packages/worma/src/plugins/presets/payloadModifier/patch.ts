import type { FieldPatchObject, FieldValue, SchemaDSL } from './type'
import type { SchemaObject } from '@/type'
import { clearTypeFamily, dslToSchemaObject, inferEnumType, stripRef } from './dsl'

/**
 * OpenAPI keywords plus `required`. An object holding one of them is a partial patch of
 * the target itself; an object holding none of them is a shorthand for `properties`.
 */
export const RESERVED_KEYS: ReadonlySet<string> = new Set([
  'type',
  'required',
  'description',
  'properties',
  'items',
  'enum',
  'oneOf',
  'anyOf',
  'allOf',
  'format',
  'example',
  'default',
  'deprecated',
  'nullable',
  'title',
])

/** Keys written through verbatim when present in a patch object. */
const DOC_KEYS = [
  'description',
  'title',
  'format',
  'example',
  'default',
  'deprecated',
  'nullable',
] as const

export interface PatchContext {
  warn: (message: string) => void
}

export interface PatchResult {
  /** `null` deletes the target. */
  schema: SchemaObject | null
  /** `undefined` keeps the current requiredness. */
  required?: boolean
}

export function isPatchObject(value: Record<string, any>): boolean {
  return Object.keys(value).some(key => RESERVED_KEYS.has(key))
}

/**
 * Applies a single patch value to a target schema. This is the one and only entry point
 * of the patch syntax: the same rules apply to the top level patch and to every value
 * inside a field table, therefore they apply recursively.
 *
 * @param current the target schema, `undefined` when the patch creates a new field
 */
export function applyFieldValue(
  current: SchemaObject | undefined,
  value: FieldValue,
  ctx: PatchContext,
): PatchResult {
  if (value === null) {
    return { schema: null }
  }

  if (typeof value === 'string' || Array.isArray(value)) {
    return { schema: replaceType(current, value) }
  }

  const patch = value as Record<string, any>
  if (!isPatchObject(patch)) {
    return applyTablePatch(current, patch as Record<string, FieldValue>, ctx)
  }

  return applyPatchObject(current, patch as FieldPatchObject, ctx)
}

/**
 * Applies a field table to a target: a value of `null` deletes the field, every other
 * value is applied recursively. Fields added this way are required unless they say otherwise.
 */
export function applyPropertiesPatch(
  target: SchemaObject,
  table: Record<string, FieldValue>,
  ctx: PatchContext,
): SchemaObject {
  const properties: Record<string, SchemaObject> = { ...(target.properties ?? {}) } as Record<string, SchemaObject>
  const required = new Set<string>(Array.isArray(target.required) ? target.required as string[] : [])

  for (const key of Object.keys(table)) {
    const isNew = !(key in properties)
    const result = applyFieldValue(isNew ? undefined : properties[key], table[key], ctx)
    if (!result.schema) {
      delete properties[key]
      required.delete(key)
      continue
    }
    properties[key] = result.schema
    const nextRequired = result.required ?? (isNew ? true : required.has(key))
    if (nextRequired) {
      required.add(key)
    }
    else {
      required.delete(key)
    }
  }

  return {
    ...target,
    type: 'object',
    properties,
    required: Array.from(required),
  } as SchemaObject
}

/** `null` as the whole table means dropping every field. */
function applyTablePatch(
  current: SchemaObject | undefined,
  table: Record<string, FieldValue>,
  ctx: PatchContext,
): PatchResult {
  const base = current ?? { type: 'object' }
  if (!isObjectTarget(base)) {
    ctx.warn('field table patch skipped: the target is not an object schema')
    return { schema: current ?? null }
  }
  return { schema: applyPropertiesPatch(base, table, ctx) }
}

function applyPatchObject(
  current: SchemaObject | undefined,
  patch: FieldPatchObject,
  ctx: PatchContext,
): PatchResult {
  let out: Record<string, any> = current ? { ...current } : {}
  let required: boolean | undefined

  if (patch.type !== undefined) {
    out = {
      ...stripRef(clearTypeFamily(out as SchemaObject)),
      ...dslToSchemaObject(patch.type),
    } as Record<string, any>
  }

  // `required` never becomes a schema key, the caller translates it.
  if (patch.required !== undefined) {
    required = !!patch.required
  }

  if (patch.properties !== undefined) {
    if (isObjectTarget(out as SchemaObject)) {
      out = applyPropertiesPatch(out as SchemaObject, patch.properties, ctx) as Record<string, any>
    }
    else {
      ctx.warn('`properties` patch skipped: the target is not an object schema')
    }
  }

  if (patch.items !== undefined) {
    out.items = dslToSchemaObject(patch.items)
    if (out.type !== 'array') {
      out.type = 'array'
    }
  }

  if (patch.enum !== undefined) {
    out.enum = patch.enum
    if (out.type === undefined) {
      const inferred = inferEnumType(patch.enum)
      if (inferred) {
        out.type = inferred
      }
    }
  }

  // A union fully determines the type, so it replaces the type family just like `type` does.
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    const members = patch[key]
    if (members === undefined) {
      continue
    }
    out = {
      ...stripRef(clearTypeFamily(out as SchemaObject)),
      [key]: members.map(item => dslToSchemaObject(item)),
    } as Record<string, any>
  }

  for (const key of DOC_KEYS) {
    const next = (patch as Record<string, unknown>)[key]
    if (next !== undefined) {
      out[key] = next
    }
  }

  return { schema: out as SchemaObject, required }
}

/** Replaces the type of a target: type-family keys are cleared, everything else is kept. */
function replaceType(current: SchemaObject | undefined, dsl: SchemaDSL): SchemaObject {
  const rest = stripRef(clearTypeFamily(current ?? {}))
  return { ...rest, ...dslToSchemaObject(dsl) } as SchemaObject
}

/** A patch may only touch the field table when the target really is an object. */
function isObjectTarget(target?: SchemaObject): boolean {
  if (!target) {
    return true
  }
  if (target.oneOf || target.anyOf || target.allOf) {
    return false
  }
  return target.type === undefined || target.type === 'object'
}
