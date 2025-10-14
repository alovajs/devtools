import type {
  ApiDescriptor,
  ApiMethod,
  GeneratorConfig,
  OpenAPIDocument,
  OperationObject,
  ParameterObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  SchemaObject,
} from '@/type'
import { cloneDeep, isEmpty } from 'lodash'
import { astLoader, schemaLoader } from '@/core/loader'
import { logger } from '@/helper/logger'
import {
  findBy$ref,
  getResponseSuccessKey,
  isReferenceObject,
  mergeObject,
  parseReference,
  removeAll$ref,
} from '@/utils'

function getTsStr(originObj: SchemaObject | ReferenceObject, options: {
  document: OpenAPIDocument
  config: GeneratorConfig
  schemasMap?: Map<string, string>
  refNameMap?: Map<string, string>
  preText?: string
}): Promise<string> {
  const { document, preText = '', config, schemasMap, refNameMap } = options
  return schemaLoader.transform(originObj, {
    document,
    deep: false,
    noEnum: true,
    commentType: 'doc',
    preText,
    defaultRequire: config.defaultRequire,
    refNameMap,
    async onReference(ast) {
      if (ast.keyName && schemasMap && !schemasMap.has(ast.keyName)) {
        const result = await astLoader.transformTsStr(ast, {
          shallowDeep: true,
          commentType: 'doc',
          noEnum: true,
          format: true,
          export: true,
        })
        schemasMap.set(ast.keyName, result)
      }
    },
  })
}
export async function parseResponse(responses: ResponsesObject | undefined, options: {
  document: OpenAPIDocument
  config: GeneratorConfig
  schemasMap: Map<string, string>
  refNameMap?: Map<string, string>
}) {
  const { document, config, schemasMap, refNameMap } = options
  const successKey = getResponseSuccessKey(responses)
  const responseInfo = responses?.[successKey]
  if (!responseInfo) {
    return {
      responseName: 'unknown',
      responseComment: 'unknown',
    }
  }
  const responseObject: ResponseObject = isReferenceObject(responseInfo)
    ? findBy$ref(responseInfo.$ref, document)
    : responseInfo
  const key = getContentKey(responseObject.content, config.responseMediaType)
  const responseSchema = responseObject?.content?.[key]?.schema ?? {}
  const responseName = await getTsStr(responseSchema, {
    document,
    config,
    schemasMap,
    refNameMap,
  })
  return {
    responseName,
    responseComment: await schemaLoader.transform(responseSchema, {
      document,
      deep: true,
      preText: '* ',
      defaultRequire: config.defaultRequire,
    }),
  }
}
export async function parseRequestBody(requestBody: RequestBodyObject | ReferenceObject | undefined, options: {
  document: OpenAPIDocument
  config: GeneratorConfig
  schemasMap: Map<string, string>
  refNameMap?: Map<string, string>
}) {
  if (!requestBody) {
    return {
      requestName: '',
      requestComment: '',
    }
  }
  const { document, config, schemasMap, refNameMap } = options
  const requestBodyObject: RequestBodyObject = isReferenceObject(requestBody)
    ? findBy$ref(requestBody.$ref, document)
    : requestBody
  const key = getContentKey(requestBodyObject.content, config.bodyMediaType)
  const requestBodySchema = requestBodyObject?.content?.[key]?.schema ?? {}
  const requestName = await getTsStr(requestBodySchema, { document, config, schemasMap, refNameMap })
  return {
    requestName,
    requestComment: await schemaLoader.transform(requestBodySchema, {
      document,
      deep: true,
      preText: '* ',
      defaultRequire: config.defaultRequire,
    }),
  }
}
function getContentKey(content: Record<string, any> = {}, requireKey = 'application/json') {
  let key = Object.keys(content)[0] || requireKey
  if (content[requireKey]) {
    key = requireKey
  }
  return key
}

export async function parseParameters(parameters: (ReferenceObject | ParameterObject)[] | undefined, options: {
  document: OpenAPIDocument
  config: GeneratorConfig
  schemasMap: Map<string, string>
  refNameMap?: Map<string, string>
}) {
  const { document, config, schemasMap, refNameMap } = options
  const pathParametersSchema: SchemaObject = {
    type: 'object',
  }
  const queryParametersSchema: SchemaObject = {
    type: 'object',
  }
  const parseParameter = (parameter: ParameterObject, parameters: SchemaObject) => {
    if (!parameters.properties) {
      parameters.properties = {}
    }
    if (!parameters.required) {
      parameters.required = []
    }
    if (parameter.required) {
      parameters.required.push(parameter.name)
    }
    parameters.properties[parameter.name] = {
      ...parameter.schema,
      description: parameter.description || '',
      deprecated: !!parameter.deprecated,
    }
  }
  const parseParametersSchema = async (parameters: SchemaObject) => {
    let parametersStr = ''
    let parametersComment = ''
    if (Object.keys(parameters.properties ?? {}).length) {
      parametersStr = await getTsStr(parameters, {
        document,
        config,
        schemasMap,
        refNameMap,
      })
      parametersComment = await schemaLoader.transform(parameters, {
        document,
        deep: true,
        preText: '* ',
        defaultRequire: config.defaultRequire,
      })
    }
    return [parametersStr, parametersComment]
  }

  for (const refParameter of parameters || []) {
    const parameter = parseReference(refParameter, document)
    if (parameter.in === 'path') {
      parseParameter(parameter, pathParametersSchema)
    }
    else if (parameter.in === 'query') {
      parseParameter(parameter, queryParametersSchema)
    }
  }

  const [pathParameters, pathParametersComment] = await parseParametersSchema(pathParametersSchema)
  const [queryParameters, queryParametersComment] = await parseParametersSchema(queryParametersSchema)
  return {
    pathParameters,
    queryParameters,
    pathParametersComment,
    queryParametersComment,
  }
}

export async function transformApiMethods(apiMethod: ApiMethod, options: {
  document: OpenAPIDocument
  config: GeneratorConfig
  refNameMap: Map<string, string>
  map?: Array<[string, any]>
}) {
  const { handleApi } = options.config
  if (!handleApi || typeof handleApi !== 'function') {
    return apiMethod
  }
  const { apiDescriptor, apiInfo } = apiMethod2ApiDescriptor(apiMethod, options)
  let newApiDescriptor: ApiDescriptor | void | undefined | null = cloneDeep(apiDescriptor)

  try {
    newApiDescriptor = handleApi(newApiDescriptor)
  }
  catch (error) {
    throw logger.throwError(error as Error)
  }
  if (!newApiDescriptor) {
    return null
  }
  Object.entries(newApiDescriptor.refNameMap || {}).forEach(([key, value]) => {
    options.refNameMap.set(key, value)
  })

  const newApiMethod = apiDescriptor2apiMethod(newApiDescriptor, {
    oldApiInfo: apiInfo,
    operationObject: apiMethod.operationObject,
  })

  newApiMethod.operationObject = mergeObject<OperationObject>(
    apiMethod.operationObject,
    newApiMethod.operationObject,
    options.document,
    options.map,
  )

  return newApiMethod
}

export function apiMethod2ApiDescriptor(apiMethod: ApiMethod, options: {
  document: OpenAPIDocument
  config: GeneratorConfig
}) {
  const { url, method } = apiMethod
  const { document, config } = options
  const operationObject = cloneDeep(apiMethod.operationObject)
  const { requestBody, responses, parameters } = operationObject
  const apiDescriptor: ApiDescriptor = {
    ...operationObject,
    requestBody: {},
    responses: {},
    parameters: [],
    url,
    method,
  }
  const successKey = getResponseSuccessKey(responses)
  const responseSuccess = responses?.[successKey]
  const refNameMap = new Map<string, string>()
  let requestBodyObject = requestBody as RequestBodyObject
  let responseObject = responseSuccess as ResponseObject
  let requestKey = 'application/json'
  let responseKey = 'application/json'
  if (parameters) {
    apiDescriptor.parameters = []
    parameters.forEach((parameter) => {
      apiDescriptor.parameters?.push(removeAll$ref<ParameterObject>(parameter, document, { refNameMap }))
    })
  }
  if (requestBody) {
    requestBodyObject = parseReference(requestBody, document, true)
    requestKey = getContentKey(requestBodyObject.content, config.bodyMediaType)
    apiDescriptor.requestBody = removeAll$ref(requestBodyObject.content?.[requestKey].schema ?? {}, document, { refNameMap })
  }
  if (responseSuccess) {
    responseObject = parseReference(responseSuccess, document, true)
    responseKey = getContentKey(responseObject.content, config.responseMediaType)
    apiDescriptor.responses = removeAll$ref(responseObject.content?.[responseKey].schema ?? {}, document, { refNameMap })
  }
  apiDescriptor.refNameMap = Object.fromEntries(refNameMap)
  return {
    apiDescriptor,
    apiInfo: {
      successKey,
      requestKey,
      responseKey,
      requestBody: requestBodyObject,
      response: responseObject,
      hasResponse: !!responseSuccess,
      hasRequestBody: !!requestBody,
      hasParameters: !!parameters,
    },
  }
}
export function apiDescriptor2apiMethod(apiDescriptor: ApiDescriptor, options: {
  operationObject: OperationObject
  oldApiInfo: {
    successKey: string
    requestKey: string
    responseKey: string
    hasResponse: boolean
    hasRequestBody: boolean
    hasParameters: boolean
    requestBody: RequestBodyObject
    response: ResponseObject
  }
}) {
  const apiDescriptorValue = cloneDeep(apiDescriptor)
  const operationObject = cloneDeep(options.operationObject)
  const { url, method } = apiDescriptorValue
  const { successKey, requestKey, responseKey, hasResponse, hasParameters, hasRequestBody, requestBody, response }
    = options.oldApiInfo
  if (!isEmpty(apiDescriptorValue.requestBody) || hasRequestBody) {
    operationObject.requestBody = requestBody || { content: {} }
    const { content } = operationObject.requestBody
    if (!content[requestKey]) {
      content[requestKey] = {}
    }
    content[requestKey].schema = apiDescriptorValue.requestBody
  }
  if (!isEmpty(apiDescriptorValue.responses) || hasResponse) {
    if (!operationObject.responses) {
      operationObject.responses = {}
    }
    operationObject.responses[successKey] = response || { content: {} }
    if (!operationObject.responses[successKey].content) {
      operationObject.responses[successKey].content = {}
    }
    const { content } = operationObject.responses[successKey]
    if (!content[responseKey]) {
      content[responseKey] = {}
    }
    content[responseKey].schema = apiDescriptorValue.responses
  }
  if (!isEmpty(apiDescriptorValue.parameters) || hasParameters) {
    operationObject.parameters = apiDescriptorValue.parameters
  }
  delete apiDescriptorValue.requestBody
  delete apiDescriptorValue.responses
  delete apiDescriptorValue.parameters
  Object.assign(operationObject, apiDescriptorValue)
  return {
    url,
    method,
    operationObject,
  } as ApiMethod
}
