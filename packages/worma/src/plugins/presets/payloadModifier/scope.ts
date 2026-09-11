import type { ModifierScope } from './type'
import type { ApiDescriptor, Parameter, SchemaObject } from '@/type'
import { ParameterIn } from '@/constant'

/** Maps a scope onto the parameter location it owns. Schema scopes have no location. */
export function scopeParameterIn(scope: ModifierScope): ParameterIn | undefined {
  if (scope === 'params') {
    return ParameterIn.QUERY
  }
  if (scope === 'pathParams') {
    return ParameterIn.PATH
  }
  return undefined
}

/** Builds an object-schema view of the parameters of one location. */
export function parametersToSchema(
  parameters: Parameter[] | undefined,
  location: ParameterIn,
): SchemaObject {
  const schema: SchemaObject = { type: 'object', properties: {}, required: [] }
  if (!Array.isArray(parameters)) {
    return schema
  }
  const properties = schema.properties as Record<string, SchemaObject>
  const required = schema.required as string[]
  for (const param of parameters) {
    if (param.in !== location) {
      continue
    }
    properties[param.name] = param.schema as SchemaObject
    if (param.required) {
      required.push(param.name)
    }
  }
  return schema
}

/** Drops every parameter of one location. */
export function removeParameters(
  parameters: Parameter[] | undefined,
  location: ParameterIn,
): Parameter[] | undefined {
  if (!Array.isArray(parameters)) {
    return parameters
  }
  return parameters.filter(param => param.in !== location)
}

/**
 * Writes an object-schema view back into parameters. Parameters of other locations are
 * kept untouched and fields absent from the original list are appended as new parameters.
 */
export function schemaToParameters(
  parameters: Parameter[] | undefined,
  schema: SchemaObject,
  location: ParameterIn,
): Parameter[] | undefined {
  if (!Array.isArray(parameters)) {
    return parameters
  }
  if (!schema || typeof schema !== 'object' || !schema.properties) {
    return removeParameters(parameters, location)
  }

  const properties = schema.properties as Record<string, SchemaObject>
  const requiredSet = new Set<string>(Array.isArray(schema.required) ? schema.required as string[] : [])
  const next: Parameter[] = []

  for (const param of parameters) {
    if (param.in !== location) {
      next.push(param)
      continue
    }
    const propSchema = properties[param.name]
    if (!propSchema) {
      continue
    }
    next.push({ ...param, schema: propSchema as Parameter['schema'], required: requiredSet.has(param.name) })
  }

  // fields added by a patch become brand new parameters
  for (const name of Object.keys(properties)) {
    if (next.some(param => param.in === location && param.name === name)) {
      continue
    }
    next.push({
      name,
      in: location,
      required: requiredSet.has(name),
      schema: properties[name] as Parameter['schema'],
    })
  }

  return next
}

/** Reads the root schema of a scope. Parameter scopes are read as an object-schema view. */
export function getScopeSchema(apiDescriptor: ApiDescriptor, scope: ModifierScope): SchemaObject | undefined {
  const location = scopeParameterIn(scope)
  if (location) {
    return parametersToSchema(apiDescriptor.parameters, location)
  }
  return scope === 'data' ? apiDescriptor.requestBody : apiDescriptor.responses
}

/**
 * Writes the root schema of a scope back into the descriptor. `null` empties the scope.
 */
export function setScopeSchema(
  apiDescriptor: ApiDescriptor,
  scope: ModifierScope,
  schema: SchemaObject | null,
): void {
  const location = scopeParameterIn(scope)
  if (location) {
    apiDescriptor.parameters = schema === null
      ? removeParameters(apiDescriptor.parameters, location)
      : schemaToParameters(apiDescriptor.parameters, schema, location)
    return
  }
  if (scope === 'data') {
    apiDescriptor.requestBody = schema ?? undefined
    return
  }
  apiDescriptor.responses = schema ?? undefined
}
