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

// Convert Schema (custom spec) -> OpenAPI SchemaObject
function toSchemaObject(base: SchemaObject, s: Schema): SchemaObject {
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
    const items = arr.map(item => toSchemaObject({}, item))
    // single element -> items is a single schema object; multiple elements -> tuple array
    ;(result as ArraySchemaObject).items = (items.length === 1 ? items[0] : items) as any
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

  // Enum: set enum and optional type
  if ((s as SchemaEnum).enum) {
    const spec = s as SchemaEnum
    result.enum = spec.enum
    if (spec.type) {
      result.type = spec.type as any
    }
    return result
  }

  // Object (reference-like map): replace properties and required with handler's spec
  // (the SchemaReference returned by the handler fully replaces this field, only keeping scalar fields like description from base)
  const ref = s as SchemaReference
  if (ref && typeof ref === 'object') {
    result.type = 'object'
    const properties: Record<string, SchemaObject> = {}
    const requiredSet = new Set<string>()

    for (const key in ref) {
      const val = ref[key]
      if (!val) {
        continue
      }
      // 兼容旧 `?` 后缀写法（向后兼容）
      const optionalByKey = key.endsWith('?')
      const cleanKey = optionalByKey ? key.slice(0, -1) : key
      let isOptional: boolean
      let effectiveVal: Schema
      if (
        !optionalByKey
        && val && typeof val === 'object' && !Array.isArray(val)
        && typeof (val as SchemaOptional).required === 'boolean'
        && 'type' in val
      ) {
        // SchemaOptional 包装：可选性由 `required` 字段表达（与逐字段分支入参统一）
        const opt = val as SchemaOptional
        isOptional = !opt.required
        effectiveVal = opt.type
      }
      else {
        isOptional = optionalByKey
        effectiveVal = val
      }
      const baseProp = properties[cleanKey]
      properties[cleanKey] = toSchemaObject(baseProp || {}, effectiveVal)
      if (isOptional) {
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
      // 必填字段裸写；可选字段用 SchemaOptional 包装（与逐字段分支入参统一，避免 `?` 魔法字符串）
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
    return schema
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
  // A returned { required, type } means changing requiredness (driven by the `type` field)
  if (typeof ret === 'object' && !Array.isArray(ret) && 'required' in ret && 'type' in ret) {
    const opt = ret as SchemaOptional
    return {
      required: !!(opt.required ?? required),
      schema: toSchemaObject(cloned, opt.type) as T,
    }
  }
  return {
    required,
    schema: toSchemaObject(cloned, ret) as T,
  }
}
