import type { PayloadModifierConfig } from './type'
import type {
  ApiDescriptor,
  ApiPlugin,
  MaybeSchemaObject,
  Parameter,
  SchemaObject,
} from '@/type'
import { extend, isMatch } from '../utils'
import { applyModifierSchema } from './hepler'

export { Schema, SchemaAllOf, SchemaAnyOf, SchemaArray, SchemaEnum, SchemaOneOf, SchemaPrimitive, SchemaReference } from './type'
// Apply modifications to object properties (for data/response scopes)
function modifySchemaProperties<T extends MaybeSchemaObject = SchemaObject>(schema: T, config: PayloadModifierConfig): T {
  if (!schema || typeof schema !== 'object') {
    return schema
  }
  const targetSchema: SchemaObject = { ...schema }

  // union recursively
  if (Array.isArray(targetSchema.oneOf)) {
    targetSchema.oneOf = targetSchema.oneOf.map(item => modifySchemaProperties(item, config))
  }
  if (Array.isArray(targetSchema.anyOf)) {
    targetSchema.anyOf = targetSchema.anyOf.map(item => modifySchemaProperties(item, config))
  }
  if (Array.isArray(targetSchema.allOf)) {
    targetSchema.allOf = targetSchema.allOf.map(item => modifySchemaProperties(item, config))
  }
  // modify properties
  if (targetSchema.properties) {
    const props = { ...targetSchema.properties } as Record<string, SchemaObject>
    let required: string[] = Array.isArray(targetSchema.required) ? [...targetSchema.required] : []

    for (const key of Object.keys(props)) {
      if (!isMatch(key, config.match)) {
        continue
      }
      const { required: requiredOverride, value: valueSchema } = applyModifierSchema(props[key], config, { required: required.includes(key) })
      required = required.filter(r => r !== key)
      if (!valueSchema) {
        delete props[key]
        continue
      }
      props[key] = valueSchema
      if (requiredOverride) {
        required.push(key)
      }
    }
    targetSchema.properties = props
    targetSchema.required = Array.from(new Set(required))
  }
  return targetSchema as T
}
function modifyParameters(
  parameters: Array<Parameter>,
  type: 'query' | 'path' | 'header' | 'cookie',
  config: PayloadModifierConfig,
): Array<Parameter> {
  if (!parameters || !Array.isArray(parameters)) {
    return parameters
  }
  return parameters.map((param) => {
    if (param.in === type) {
      if (!isMatch(param.name, config.match)) {
        return param
      }
      const { value: schema, required } = applyModifierSchema(param.schema!, config, { required: !!param.required })
      if (!schema) {
        return null
      }
      return {
        ...param,
        schema,
        required,
      }
    }
    return param
  }).filter(item => item !== null)
}
function payloadModifierApiDescriptor(apiDescriptor: ApiDescriptor, config: PayloadModifierConfig) {
  if (!apiDescriptor) {
    return null
  }
  const newDescriptor = { ...apiDescriptor }
  const { scope } = config
  switch (scope) {
    case 'params':
      if (newDescriptor.parameters) {
        newDescriptor.parameters = modifyParameters(newDescriptor.parameters, 'query', config)
      }
      break
    case 'pathParams':
      if (newDescriptor.parameters) {
        newDescriptor.parameters = modifyParameters(newDescriptor.parameters, 'path', config)
      }
      break
    case 'data':
      if (newDescriptor.requestBody) {
        newDescriptor.requestBody = modifySchemaProperties(newDescriptor.requestBody, config)
      }
      break
    case 'response':
      if (newDescriptor.responses) {
        newDescriptor.responses = modifySchemaProperties(newDescriptor.responses, config)
      }
      break
    default:
      break
  }
  return newDescriptor
}
export function payloadModifier(configs: PayloadModifierConfig[]): ApiPlugin {
  return {
    name: 'payloadModifier',
    config(config) {
      return extend(config, {
        handleApi: (apiDescriptor: ApiDescriptor) => {
          if (!apiDescriptor) {
            return null
          }
          // Apply each configuration in sequence
          return configs.reduce<ApiDescriptor | null>((desc, conf) => {
            if (!desc) {
              return null
            }
            return payloadModifierApiDescriptor(desc, conf)
          }, apiDescriptor)
        },
      })
    },
  }
}

export default payloadModifier
