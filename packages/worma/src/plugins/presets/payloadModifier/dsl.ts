import type { SchemaDSL, SchemaPrimitive } from './type'
import type { SchemaObject, SchemaType } from '@/type'

const VALID_PRIMITIVES: ReadonlySet<string> = new Set([
  'number',
  'string',
  'boolean',
  'undefined',
  'null',
  'unknown',
  'any',
  'never',
])

/**
 * Keys describing the type shape. They are dropped when a type is replaced so that no
 * leftover of the previous type survives (e.g. a stale `format: 'int64'`).
 * Everything else — documentation keys above all — is kept.
 */
export const TYPE_FAMILY_KEYS = [
  'type',
  'properties',
  'items',
  'enum',
  'oneOf',
  'anyOf',
  'allOf',
  'format',
  'required',
] as const

export function isSchemaPrimitive(value: unknown): value is SchemaPrimitive {
  return typeof value === 'string' && VALID_PRIMITIVES.has(value)
}

/** Rejects anything that is not a known type expression. */
function assertPrimitive(value: string): SchemaPrimitive {
  if (!VALID_PRIMITIVES.has(value)) {
    throw new Error(
      `[payloadModifier] Invalid schema type "${value}". Must be one of: ${[...VALID_PRIMITIVES].join(', ')}`,
    )
  }
  return value as SchemaPrimitive
}

/** Copies a schema keeping every documentation key and dropping every type-family key. */
export function clearTypeFamily(schema: SchemaObject): SchemaObject {
  const rest: Record<string, any> = { ...schema }
  for (const key of TYPE_FAMILY_KEYS) {
    delete rest[key]
  }
  return rest as SchemaObject
}

/**
 * Drops the internal `_$ref` marker stamped by the dereference step. Without this, a
 * replaced node would still look like a reference to the original component and the
 * downstream merge step would restore the component instead of keeping the change.
 */
export function stripRef<T extends SchemaObject>(schema: T): T {
  if (!schema || typeof schema !== 'object') {
    return schema
  }
  const rest: Record<string, any> = { ...schema }
  delete rest._$ref
  return rest as T
}

/**
 * Converts a spec DSL expression into a raw OpenAPI schema object.
 * This is the only conversion direction the plugin has: nothing ever converts a schema
 * back into the DSL, so no documentation can be lost along the way.
 */
export function dslToSchemaObject(dsl: SchemaDSL): SchemaObject {
  if (typeof dsl === 'string') {
    return { type: assertPrimitive(dsl) } as SchemaObject
  }

  if (Array.isArray(dsl)) {
    return { type: 'array', items: dslToItems(dsl) } as SchemaObject
  }

  const spec = dsl as Record<string, any>
  if (Array.isArray(spec.oneOf)) {
    return { oneOf: toSchemaList(spec.oneOf) }
  }
  if (Array.isArray(spec.anyOf)) {
    return { anyOf: toSchemaList(spec.anyOf) }
  }
  if (Array.isArray(spec.allOf)) {
    return { allOf: toSchemaList(spec.allOf) }
  }
  if (Array.isArray(spec.enum)) {
    return enumToSchemaObject(spec.enum, spec.type)
  }

  // object shorthand
  const properties: Record<string, SchemaObject> = {}
  for (const key of Object.keys(spec)) {
    properties[key] = dslToSchemaObject(spec[key])
  }
  return { type: 'object', properties, required: Object.keys(spec) }
}

function toSchemaList(list: SchemaDSL[]): SchemaObject[] {
  return list.map(item => dslToSchemaObject(item))
}

/** A single element becomes `items`, multiple elements become a tuple (array) `items`. */
function dslToItems(list: SchemaDSL[]): SchemaObject | SchemaObject[] {
  const items = toSchemaList(list)
  return items.length === 1 ? items[0] : items
}

function enumToSchemaObject(
  values: Array<string | number | boolean | null>,
  declared?: SchemaPrimitive,
): SchemaObject {
  const result: Record<string, any> = { enum: values }
  const type = declared !== undefined
    ? enumTypeToSchemaType(assertPrimitive(declared), values)
    : inferEnumType(values)
  if (type) {
    result.type = type
  }
  return result as SchemaObject
}

/**
 * Maps a declared DSL type onto the OpenAPI type of an enum: `number` becomes `integer`
 * when every value is an integer, otherwise it stays `number`. TS-only types such as
 * `any` or `never` are written through as-is.
 */
function enumTypeToSchemaType(
  declared: SchemaPrimitive,
  values: Array<string | number | boolean | null>,
): SchemaType {
  if (declared === 'number') {
    return values.every(value => typeof value === 'number' && Number.isInteger(value))
      ? 'integer'
      : 'number'
  }
  return declared as SchemaType
}

/**
 * Infers the OpenAPI type of an enum from its values. Returns `undefined` for mixed or
 * empty values so no (possibly wrong) type is written.
 */
export function inferEnumType(values: Array<string | number | boolean | null>): SchemaType | undefined {
  if (!values.length) {
    return undefined
  }
  if (values.every(value => typeof value === 'string')) {
    return 'string'
  }
  if (values.every(value => typeof value === 'boolean')) {
    return 'boolean'
  }
  if (values.every(value => typeof value === 'number')) {
    return values.every(value => Number.isInteger(value)) ? 'integer' : 'number'
  }
  return undefined
}
