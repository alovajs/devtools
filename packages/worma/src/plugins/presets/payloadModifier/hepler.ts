import type {
  PayloadModifierConfig,
  Schema,
  SchemaAllOf,
  SchemaAnyOf,
  SchemaEnum,
  SchemaOneOf,
  SchemaOptional,
  SchemaPrimitive,
  SchemaReference,
} from './type'
import type {
  ArraySchemaObject,
  MaybeSchemaObject,
  SchemaObject,
  SchemaType,
} from '@/type'

// Detect a `SchemaOptional` wrapper: { required: boolean, type: Schema }.
// The `required` must be a literal boolean so a plain SchemaReference whose
// property happens to be named "required" (e.g. { required: 'boolean' }) is not misread.
function isSchemaOptional(val: unknown): val is SchemaOptional {
  return !!val
    && typeof val === 'object'
    && !Array.isArray(val)
    && typeof (val as SchemaOptional).required === 'boolean'
    && 'type' in (val as object)
}

// Collapse (possibly nested) `SchemaOptional` wrappers.
// - The OUTERMOST `required` wins; inner `required` fields are ignored.
// - A non-wrapped value defaults to required (required: true).
function unwrapOptional(s: Schema): { required: boolean, type: Schema } {
  if (!isSchemaOptional(s)) {
    return { required: true, type: s }
  }
  const required = s.required
  let type: Schema = s.type
  while (isSchemaOptional(type)) {
    type = type.type
  }
  return { required, type }
}

// Remove the internal `_$ref` marker that `removeAll$ref` stamps onto dereferenced
// component schemas. When a handler replaces a schema, the result must NOT inherit the
// original component's `_$ref` — otherwise `mergeObject`/`removeBaseReference` downstream
// treats the replacement as a reference to the original component and discards the change.
function stripInternalRef(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema
  }
  if (Array.isArray(schema)) {
    return schema.map(stripInternalRef)
  }
  const out: Record<string, any> = {}
  for (const key of Object.keys(schema)) {
    if (key === '_$ref') {
      continue
    }
    out[key] = stripInternalRef(schema[key])
  }
  return out
}

// Set of valid SchemaPrimitive values for O(1) validation lookup
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

function validatePrimitive(val: string): void {
  if (!VALID_PRIMITIVES.has(val)) {
    throw new Error(
      `[payloadModifier] Invalid schema type "${val}". Must be one of: ${[...VALID_PRIMITIVES].join(', ')}`,
    )
  }
}

// Convert Schema (custom spec) -> OpenAPI SchemaObject
function toSchemaObject(base: SchemaObject, s: Schema): SchemaObject {
  // A `SchemaOptional` wrapper only affects requiredness (handled by the caller);
  // here we care about the type shape, so fully unwrap nested wrappers first.
  if (isSchemaOptional(s)) {
    s = unwrapOptional(s).type
  }
  const result: SchemaObject = { ...base }
  const cleanType = (schema: SchemaObject) => {
    delete schema.type
    delete schema.enum
    delete schema.oneOf
    delete schema.anyOf
    delete schema.allOf
    delete (schema as any).items
    delete schema.properties
    delete schema.required
    return schema
  }

  // Native array type (elements are Schema)
  if (Array.isArray(s)) {
    const arr = s as Schema[]
    cleanType(result)
    result.type = 'array'
    // Pass the original `items` down as the base of each element so documentation
    // fields (e.g. `description`) survive the round-trip.
    const baseItems = (base as ArraySchemaObject).items
    const baseItemsList = Array.isArray(baseItems) ? baseItems : (baseItems ? [baseItems] : [])
    const items = arr.map((item, idx) => toSchemaObject((baseItemsList[idx] || {}) as SchemaObject, item))
    // single element -> items is a single schema object; multiple elements -> tuple array
    ;(result as ArraySchemaObject).items = (items.length === 1 ? items[0] : items) as any
    return result
  }

  // Primitive types — validate against SchemaPrimitive set during conversion
  if (typeof s === 'string') {
    validatePrimitive(s)
    // Drop the structural fields inherited from the base so they don't leak into the
    // new type; documentation fields such as `description` are kept.
    cleanType(result)
    result.type = s as SchemaType
    return result
  }

  // Handle union keywords: overwrite arrays but preserve unrelated fields
  if ((s as SchemaOneOf).oneOf) {
    const spec = s as SchemaOneOf
    const baseOneOf = base.oneOf || []
    cleanType(result)
    result.oneOf = spec.oneOf.map((item, idx) => toSchemaObject(baseOneOf[idx] || {}, item))
    return result
  }
  if ((s as SchemaAnyOf).anyOf) {
    const spec = s as SchemaAnyOf
    const baseAnyOf = base.anyOf || []
    cleanType(result)
    result.anyOf = spec.anyOf.map((item, idx) => toSchemaObject(baseAnyOf[idx] || {}, item))
    return result
  }
  if ((s as SchemaAllOf).allOf) {
    const spec = s as SchemaAllOf
    const baseAllOf = base.allOf || []
    cleanType(result)
    result.allOf = spec.allOf.map((item, idx) => toSchemaObject(baseAllOf[idx] || {}, item))
    return result
  }

  // Enum: write the enum values back, converting the TS primitive type from the
  // handler into its OpenAPI counterpart (`number` -> `integer`/`number`, `string`, ...).
  if ((s as SchemaEnum).enum) {
    const spec = s as SchemaEnum
    // Drop the structural fields inherited from the base; documentation fields are kept.
    cleanType(result)
    result.enum = spec.enum
    if (spec.type) {
      if (typeof spec.type === 'string') {
        validatePrimitive(spec.type)
      }
      // `number` only becomes `integer` when every enum value is an integer.
      result.type = enumTypeToSchemaType(spec.type, spec.enum)
    }
    else {
      // No type from the handler: keep an OpenAPI 3.1 type array (e.g. `['string', 'null']`)
      // as-is, otherwise infer the type from the enum values.
      const fallback = Array.isArray(base.type) ? base.type : inferEnumType(spec.enum)
      if (fallback) {
        result.type = fallback
      }
      // otherwise the enum stays untyped (mixed or empty values)
    }
    return result
  }

  // Object (reference-like map): replace properties and required with handler's spec
  // (the SchemaReference returned by the handler fully replaces this field, only keeping
  // scalar fields like description from base)
  const ref = s as SchemaReference
  if (ref && typeof ref === 'object') {
    // Drop the structural fields inherited from the base; documentation fields are kept.
    cleanType(result)
    result.type = 'object'
    const properties: Record<string, SchemaObject> = {}
    const requiredSet = new Set<string>()
    // The base of each property is taken from the ORIGINAL `base.properties` (not from the
    // object being built) so documentation fields like `description` survive the round-trip.
    const baseProperties = (base.properties || {}) as Record<string, SchemaObject>

    for (const key in ref) {
      const val = ref[key]
      if (!val) {
        continue
      }
      // SchemaOptional wrapper: optionality expressed via { required, type };
      // bare value defaults to required. Nested wrappers are collapsed — outermost
      // `required` wins, inner ones are ignored.
      let isOptional: boolean
      let effectiveVal: Schema
      if (isSchemaOptional(val)) {
        const { required, type } = unwrapOptional(val)
        isOptional = !required
        effectiveVal = type
      }
      else {
        isOptional = false
        effectiveVal = val
      }
      const baseProp = baseProperties[key]
      properties[key] = toSchemaObject(baseProp || {}, effectiveVal)
      if (isOptional) {
        requiredSet.delete(key)
      }
      else {
        requiredSet.add(key)
      }
    }

    result.properties = properties
    result.required = Array.from(requiredSet)
    return result
  }

  return result
}
function schemaTypeToPrimitiveType(t?: SchemaType): SchemaPrimitive {
  if (t === null) {
    return 'null'
  }
  if (t === undefined) {
    return 'undefined'
  }
  if (!t) {
    return 'unknown'
  }
  if (t === 'integer') {
    return 'number'
  }
  return t as SchemaPrimitive
}

// Convert a SchemaPrimitive (the TS type used by the handler) back into the OpenAPI type
// of an enum. A numeric enum is written as `integer` (the OpenAPI counterpart of the TS
// `number`) only when every value is an integer, otherwise it stays `number` so the type
// matches the values. `string`/`boolean` map 1:1, TS-only types are written through as-is.
function enumTypeToSchemaType(t: SchemaPrimitive, enumValues: SchemaEnum['enum']): SchemaType {
  if (t === 'number') {
    return enumValues.every(v => typeof v === 'number' && Number.isInteger(v))
      ? 'integer'
      : 'number'
  }
  return t as SchemaType
}

// Infer the OpenAPI type of an enum from its values, used when no type is declared so the
// enum does not stay untyped. Returns `undefined` for mixed or empty values so that no
// (possibly wrong) type is written.
function inferEnumType(enumValues: SchemaEnum['enum']): SchemaType | undefined {
  if (!enumValues.length) {
    return undefined
  }
  if (enumValues.every(v => typeof v === 'string')) {
    return 'string'
  }
  if (enumValues.every(v => typeof v === 'boolean')) {
    return 'boolean'
  }
  if (enumValues.every(v => typeof v === 'number')) {
    return enumValues.every(v => Number.isInteger(v)) ? 'integer' : 'number'
  }
  // mixed value types -> leave the enum untyped
  return undefined
}
// Convert existing OpenAPI SchemaObject -> Schema (best-effort, for handler input)
function toSchemaSpec(obj: SchemaObject): Schema {
  if (!obj || typeof obj !== 'object') {
    return 'unknown'
  }

  // Union keywords
  if (Array.isArray(obj.oneOf)) {
    const arr = obj.oneOf as SchemaObject[]
    return { oneOf: arr.map(item => toSchemaSpec(item)) }
  }
  if (Array.isArray(obj.anyOf)) {
    const arr = obj.anyOf as SchemaObject[]
    return { anyOf: arr.map(item => toSchemaSpec(item)) }
  }
  if (Array.isArray(obj.allOf)) {
    const arr = obj.allOf as SchemaObject[]
    return { allOf: arr.map(item => toSchemaSpec(item)) }
  }

  // Enum: the OpenAPI type is normalized to its TS primitive counterpart
  // (e.g. `integer` -> `number`), consistent with how plain primitives are converted.
  if (Array.isArray(obj.enum) && obj.enum.length > 0) {
    const type = typeof obj.type === 'string'
      ? schemaTypeToPrimitiveType(obj.type as SchemaType)
      : undefined
    return { enum: obj.enum, type } as SchemaEnum
  }

  // Array -> native array
  if (obj.type === 'array' || (obj as any).items) {
    const items = (obj as ArraySchemaObject).items
    if (Array.isArray(items)) {
      return items.map((it: any) => toSchemaSpec(it))
    }
    if (items) {
      return [toSchemaSpec(items)]
    }
    return ['unknown']
  }

  // Object
  if (obj.type === 'object' || obj.properties) {
    const properties = obj.properties || {}
    const requiredSet = new Set<string>(Array.isArray(obj.required) ? obj.required : [])
    const result: SchemaReference = {}
    for (const key of Object.keys(properties)) {
      const spec = toSchemaSpec(properties[key])
      // Required fields are written bare; optional fields wrapped with SchemaOptional
      result[key] = requiredSet.has(key) ? spec : { required: false, type: spec }
    }
    return result
  }

  // type union as array -> oneOf
  if (Array.isArray(obj.type)) {
    const typeArr = obj.type
    const mapped = typeArr.map(schemaTypeToPrimitiveType)
    return { oneOf: mapped } as SchemaOneOf
  }
  return schemaTypeToPrimitiveType(obj.type)
}

interface ApplyModifierSchemaOptions {
  required: boolean
  // The matched field key. `undefined` when the whole scope object is passed (no `match`).
  key?: string
}
// Replace whole schema based on handler result (used for params/pathParams)
export function applyModifierSchema<T extends MaybeSchemaObject = SchemaObject>(
  schema: T,
  config: PayloadModifierConfig,
  { required, key }: ApplyModifierSchemaOptions,
): {
  required: boolean
  schema: T | null
} {
  if (!schema || typeof schema !== 'object') {
    return { required, schema: schema as T }
  }

  const cloned: SchemaObject = { ...schema }
  const currentSpec = toSchemaSpec(cloned)
  // When the field is itself optional and is a primitive, wrap it as { required, type } before passing to handler
  const handlerInput: Schema
    = (required === false && typeof currentSpec === 'string')
      ? { required: false, type: currentSpec }
      : currentSpec
  const ret = config.handler(handlerInput, key)
  if (!ret) {
    return {
      required,
      schema: null,
    }
  }
  // A returned SchemaOptional means changing requiredness (driven by the `type` field).
  // Nested wrappers are collapsed: the outermost `required` wins, inner ones are ignored;
  // `type` may be any Schema expression (primitive, object, array, union, ...).
  if (isSchemaOptional(ret)) {
    const { required: nextRequired, type } = unwrapOptional(ret)
    let r = stripInternalRef(toSchemaObject(cloned, type)) as T
    // When handler explicitly sets required=false, propagate to object-level required array
    // so all properties become nullable as semantically expected
    if (!nextRequired && r && typeof r === 'object' && !Array.isArray(r)) {
      const robj = r as Record<string, any>
      if (robj.type === 'object' && Array.isArray(robj.required) && robj.required.length > 0) {
        r = { ...r, required: [] } as T
      }
    }
    return {
      required: nextRequired,
      schema: r,
    }
  }
  // Non-SchemaOptional return: handler explicitly provides a type value,
  // so default to required=true (the handler had the chance to wrap with
  // { required: false, type: ... } if it wanted to keep it optional).
  const r = stripInternalRef(toSchemaObject(cloned, ret)) as T
  return {
    required: true,
    schema: r,
  }
}
