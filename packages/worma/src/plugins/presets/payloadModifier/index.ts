import type { PayloadModifierConfig } from './type'
import type {
  ApiDescriptor,
  ApiPlugin,
  Parameter,
  SchemaObject,
} from '@/type'
import { ParameterIn, PluginName } from '@/constant'
import { extend, isMatch } from '../utils'
import { applyModifierSchema } from './hepler'

export { Schema, SchemaAllOf, SchemaAnyOf, SchemaArray, SchemaEnum, SchemaOneOf, SchemaPrimitive, SchemaReference } from './type'

// Convert parameters of a specific type (query/path) into an object schema
function parametersToSchema(parameters: Parameter[] | undefined, type: ParameterIn): SchemaObject {
  if (!parameters || !Array.isArray(parameters)) {
    return { type: 'object', properties: {}, required: [] }
  }
  const schema: SchemaObject = { type: 'object', properties: {}, required: [] }
  for (const param of parameters) {
    if (param.in === type) {
      ;(schema.properties as Record<string, SchemaObject>)[param.name] = param.schema as SchemaObject
      if (param.required) {
        ;(schema.required as string[]).push(param.name)
      }
    }
  }
  return schema
}

// Convert an object schema back to parameters, keeping other types untouched
function schemaToParameters(
  parameters: Parameter[] | undefined,
  schema: SchemaObject | null,
  type: ParameterIn,
): Parameter[] | undefined {
  if (!parameters || !Array.isArray(parameters)) {
    return parameters
  }
  if (!schema || typeof schema !== 'object' || !schema.properties) {
    return parameters.filter(param => param.in !== type)
  }
  const requiredSet = new Set(Array.isArray(schema.required) ? (schema.required as string[]) : [])
  const newParameters: Parameter[] = []
  for (const param of parameters) {
    if (param.in !== type) {
      newParameters.push(param)
      continue
    }
    const propSchema = (schema.properties as Record<string, NonNullable<Parameter['schema']>>)[param.name]
    if (!propSchema) {
      continue
    }
    newParameters.push({
      ...param,
      schema: propSchema as Parameter['schema'],
      required: requiredSet.has(param.name),
    })
  }
  return newParameters
}

// Apply modifications to a single matched property (used when `match` is set)
function modifySchemaProperties<T extends SchemaObject = SchemaObject>(schema: T, config: PayloadModifierConfig): T {
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
      const { required: requiredOverride, schema: schemaValue } = applyModifierSchema(props[key], config, { required: required.includes(key), key })
      required = required.filter(r => r !== key)
      if (!schemaValue) {
        delete props[key]
        continue
      }
      props[key] = schemaValue
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
  parameters: Parameter[],
  type: ParameterIn,
  config: PayloadModifierConfig,
): Parameter[] {
  if (!parameters || !Array.isArray(parameters)) {
    return parameters
  }
  return parameters.map((param) => {
    if (param.in === type) {
      if (!isMatch(param.name, config.match)) {
        return param
      }
      const { schema, required } = applyModifierSchema(param.schema!, config, { required: !!param.required, key: param.name })
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
  const { scope, match } = config
  switch (scope) {
    case 'params':
      if (newDescriptor.parameters) {
        newDescriptor.parameters = match
          ? modifyParameters(newDescriptor.parameters, ParameterIn.QUERY, config)
          : schemaToParameters(
              newDescriptor.parameters,
              applyModifierSchema(parametersToSchema(newDescriptor.parameters, ParameterIn.QUERY), config, { required: false })
                .schema,
              ParameterIn.QUERY,
            )
      }
      break
    case 'pathParams':
      if (newDescriptor.parameters) {
        newDescriptor.parameters = match
          ? modifyParameters(newDescriptor.parameters, ParameterIn.PATH, config)
          : schemaToParameters(
              newDescriptor.parameters,
              applyModifierSchema(parametersToSchema(newDescriptor.parameters, ParameterIn.PATH), config, { required: false })
                .schema,
              ParameterIn.PATH,
            )
      }
      break
    case 'data':
      if (newDescriptor.requestBody) {
        newDescriptor.requestBody = match
          ? modifySchemaProperties(newDescriptor.requestBody, config)
          : applyModifierSchema(newDescriptor.requestBody, config, { required: false }).schema ?? undefined
      }
      break
    case 'response':
      if (newDescriptor.responses) {
        newDescriptor.responses = match
          ? modifySchemaProperties(newDescriptor.responses, config)
          : applyModifierSchema(newDescriptor.responses, config, { required: false }).schema ?? undefined
      }
      break
    default:
      break
  }
  return newDescriptor
}

export function payloadModifier(configs: PayloadModifierConfig[]): ApiPlugin {
  return {
    name: PluginName.PAYLOAD_MODIFIER,
    config({ config }) {
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
