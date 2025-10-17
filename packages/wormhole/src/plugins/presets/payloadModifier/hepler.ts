import type {
  PayloadModifierConfig,
  Schema,
  SchemaAllOf,
  SchemaAnyOf,
  SchemaArray,
  SchemaEnum,
  SchemaOneOf,
  SchemaPrimitive,
  SchemaReference,
} from './type'
import type {
  ArraySchemaObject,
  MaybeSchemaObject,
  SchemaObject,
  SchemaType,
} from '@/type'

// Convert Schema (custom spec) -> OpenAPI SchemaObject
function toSchemaObject(base: SchemaObject, s: Schema): SchemaObject {
  const result: SchemaObject = { ...base }

  // Legacy union as array (treated as oneOf)
  if (Array.isArray(s)) {
    result.oneOf = s.map(item => toSchemaObject({}, item))
    return result
  }

  // Primitive types and no-op primitives
  if (typeof s === 'string') {
    result.type = s as SchemaType
    return result
  }

  // Handle union keywords: overwrite arrays but preserve unrelated fields
  if ((s as SchemaOneOf).oneOf) {
    const spec = s as SchemaOneOf
    result.oneOf = spec.oneOf.map(item => toSchemaObject({}, item))
  }
  if ((s as SchemaAnyOf).anyOf) {
    const spec = s as SchemaAnyOf
    result.anyOf = spec.anyOf.map(item => toSchemaObject({}, item))
  }
  if ((s as SchemaAllOf).allOf) {
    const spec = s as SchemaAllOf
    result.allOf = spec.allOf.map(item => toSchemaObject({}, item))
  }

  // Enum: set enum and optional type
  if ((s as SchemaEnum).enum) {
    const spec = s as SchemaEnum
    result.enum = spec.enum
    if (spec.type) {
      result.type = spec.type
    }
  }

  // Array: set/merge items
  if ((s as SchemaArray).type === 'array') {
    const spec = s as SchemaArray
    result.type = 'array'
    const baseItems = (result as any).items
    if (Array.isArray(spec.items)) {
      // Tuple items: replace entire items with tuple
      const items = spec.items.map(item => toSchemaObject({}, item))
      ;(result as ArraySchemaObject).items = items as any
    }
    else {
      // Single items: merge into existing items schema
      const patchItem = toSchemaObject(typeof baseItems === 'object' ? baseItems : {}, spec.items)
      ;(result as ArraySchemaObject).items = patchItem
    }
    return result
  }

  // Object (reference-like map): merge properties and required
  const ref = s as SchemaReference
  if (ref && typeof ref === 'object') {
    result.type = 'object'
    const properties: Record<string, SchemaObject> = { ...result.properties }
    const requiredSet = new Set<string>(Array.isArray(result.required) ? result.required : [])

    for (const key in ref) {
      const val = ref[key]
      if (!val) {
        continue
      }
      const optional = key.endsWith('?')
      const cleanKey = optional ? key.slice(0, -1) : key
      const baseProp = properties[cleanKey]
      properties[cleanKey] = toSchemaObject(baseProp || {}, val)
      if (optional) {
        requiredSet.delete(cleanKey)
      }
      else {
        requiredSet.add(cleanKey)
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

  // Enum
  if (Array.isArray(obj.enum) && obj.enum.length > 0) {
    const type = typeof obj.type === 'string' ? (obj.type as any) : undefined
    return { enum: obj.enum, type } as SchemaEnum
  }

  // Array
  if (obj.type === 'array' || (obj as any).items) {
    const items = (obj as ArraySchemaObject).items
    if (Array.isArray(items)) {
      return { type: 'array', items: items.map((it: any) => toSchemaSpec(it)) }
    }
    if (items) {
      return { type: 'array', items: toSchemaSpec(items) }
    }
    return { type: 'array', items: 'unknown' }
  }

  // Object
  if (obj.type === 'object' || obj.properties) {
    const properties = obj.properties || {}
    const requiredSet = new Set<string>(Array.isArray(obj.required) ? obj.required : [])
    const result: SchemaReference = {}
    for (const key of Object.keys(properties)) {
      const spec = toSchemaSpec(properties[key])
      const finalKey = requiredSet.has(key) ? key : `${key}?`
      result[finalKey] = spec
    }
    return result
  }

  // type union as array
  if (Array.isArray(obj.type)) {
    const typeArr = obj.type
    const mapped = typeArr.map(schemaTypeToPrimitiveType)
    return { oneOf: mapped } as SchemaOneOf
  }
  return schemaTypeToPrimitiveType(obj.type)
}

interface ApplyModifierSchemaOptions {
  required: boolean
}
// Replace whole schema based on handler result (used for params/pathParams)
export function applyModifierSchema<T extends MaybeSchemaObject = SchemaObject>(
  schema: T,
  config: PayloadModifierConfig,
  { required }: ApplyModifierSchemaOptions,
): {
  required: boolean
  value: T | null
} {
  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const cloned: SchemaObject = { ...schema }
  const currentSpec = toSchemaSpec(cloned)
  const ret = config.handler(currentSpec)
  if (!ret) {
    return {
      required,
      value: null,
    }
  }
  if (typeof ret === 'object' && 'required' in ret && 'value' in ret) {
    return {
      required: !!(ret.required ?? required),
      value: toSchemaObject(cloned, ret.value) as T,
    }
  }
  return {
    required,
    value: toSchemaObject(cloned, ret) as T,
  }
}
