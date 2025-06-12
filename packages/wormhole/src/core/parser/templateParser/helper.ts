import { schemaLoader, standardLoader } from '@/core/loader';
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
  SchemaObject
} from '@/type';
import {
  findBy$ref,
  getResponseSuccessKey,
  isReferenceObject,
  mergeObject,
  parseReference,
  removeAll$ref
} from '@/utils/openapi';
import { cloneDeep, isEmpty } from 'lodash';

const remove$ref = (
  originObj: SchemaObject | ReferenceObject,
  openApi: OpenAPIDocument,
  config: GeneratorConfig,
  schemasMap?: Map<string, string>,
  preText: string = '',
  searchMap: Map<string, string> = new Map(),
  map: Map<string, string> = new Map()
): Promise<string> =>
  schemaLoader.transform(originObj, {
    document: openApi,
    deep: false,
    commentStyle: 'document',
    preText,
    searchMap,
    defaultRequire: config.defaultRequire,
    on$Ref(refOject) {
      const type = standardLoader.transformRefName(refOject.$ref);
      if (schemasMap && !schemasMap.has(type)) {
        schemaLoader
          .transformTsStr(refOject, {
            name: type,
            document: openApi,
            export: true,
            defaultRequire: config.defaultRequire,
            on$RefTsStr(name, tsStr) {
              schemasMap.set(name, tsStr);
            },
            searchMap,
            map
          })
          .then(schema => {
            schemasMap.set(type, schema);
          });
      }
    }
  });
export const parseResponse = async (
  responses: ResponsesObject | undefined,
  openApi: OpenAPIDocument,
  config: GeneratorConfig,
  schemasMap: Map<string, string>,
  searchMap: Map<string, string>,
  removeMap: Map<string, string>
) => {
  const successKey = getResponseSuccessKey(responses);
  const responseInfo = responses?.[successKey];
  if (!responseInfo) {
    return {
      responseName: 'unknown',
      responseComment: 'unknown'
    };
  }
  const responseObject: ResponseObject = isReferenceObject(responseInfo)
    ? findBy$ref(responseInfo.$ref, openApi)
    : responseInfo;
  const key = getContentKey(responseObject.content, config.responseMediaType);
  const responseSchema = responseObject?.content?.[key]?.schema ?? {};
  const responseName = await remove$ref(responseSchema, openApi, config, schemasMap, '', removeMap);
  return {
    responseName,
    responseComment: await schemaLoader.transform(responseSchema, {
      document: openApi,
      deep: true,
      preText: '* ',
      searchMap,
      defaultRequire: config.defaultRequire
    })
  };
};
export const parseRequestBody = async (
  requestBody: RequestBodyObject | ReferenceObject | undefined,
  openApi: OpenAPIDocument,
  config: GeneratorConfig,
  schemasMap: Map<string, string>,
  searchMap: Map<string, string>,
  removeMap: Map<string, string>
) => {
  if (!requestBody) {
    return {
      requestName: '',
      requestComment: ''
    };
  }
  const requestBodyObject: RequestBodyObject = isReferenceObject(requestBody)
    ? findBy$ref(requestBody.$ref, openApi)
    : requestBody;
  const key = getContentKey(requestBodyObject.content, config.bodyMediaType);
  const requestBodySchema = requestBodyObject?.content?.[key]?.schema ?? {};
  const requestName = await remove$ref(requestBodySchema, openApi, config, schemasMap, '', removeMap);
  return {
    requestName,
    requestComment: await schemaLoader.transform(requestBodySchema, {
      document: openApi,
      deep: true,
      preText: '* ',
      searchMap,
      defaultRequire: config.defaultRequire
    })
  };
};
const getContentKey = (content: Record<string, any> = {}, requireKey = 'application/json') => {
  let key = Object.keys(content)[0] || requireKey;
  if (content[requireKey]) {
    key = requireKey;
  }
  return key;
};
export const parseParameters = async (
  parameters: (ReferenceObject | ParameterObject)[] | undefined,
  openApi: OpenAPIDocument,
  config: GeneratorConfig,
  schemasMap: Map<string, string>,
  searchMap: Map<string, string>,
  removeMap: Map<string, string>
) => {
  const pathParameters: SchemaObject = {
    type: 'object'
  };
  const queryParameters: SchemaObject = {
    type: 'object'
  };
  for (const refParameter of parameters || []) {
    const parameter = isReferenceObject(refParameter)
      ? findBy$ref<ParameterObject>(refParameter.$ref, openApi)
      : refParameter;
    if (parameter.in === 'path') {
      if (!pathParameters.properties) {
        pathParameters.properties = {};
      }
      if (!pathParameters.required) {
        pathParameters.required = [];
      }
      if (parameter.required) {
        pathParameters.required.push(parameter.name);
      }
      pathParameters.properties[parameter.name] = {
        ...parameter.schema,
        description: parameter.description || '',
        deprecated: !!parameter.deprecated
      };
    }
    if (parameter.in === 'query') {
      if (!queryParameters.properties) {
        queryParameters.properties = {};
      }
      if (!queryParameters.required) {
        queryParameters.required = [];
      }
      if (parameter.required) {
        queryParameters.required.push(parameter.name);
      }
      queryParameters.properties[parameter.name] = {
        ...parameter.schema,
        description: parameter.description || '',
        deprecated: !!parameter.deprecated
      };
    }
  }
  let pathParametersStr = '';
  let queryParametersStr = '';
  let pathParametersComment = '';
  let queryParametersComment = '';
  if (Object.keys(pathParameters.properties ?? {}).length) {
    pathParametersStr = await remove$ref(pathParameters, openApi, config, schemasMap, '', removeMap);
    pathParametersComment = await schemaLoader.transform(pathParameters, {
      document: openApi,
      deep: true,
      preText: '* ',
      searchMap,
      defaultRequire: config.defaultRequire
    });
  }
  if (Object.keys(queryParameters.properties ?? {}).length) {
    queryParametersStr = await remove$ref(queryParameters, openApi, config, schemasMap, '', removeMap);
    queryParametersComment = await schemaLoader.transform(queryParameters, {
      document: openApi,
      deep: true,
      preText: '* ',
      searchMap,
      defaultRequire: config.defaultRequire
    });
  }
  return {
    pathParameters: pathParametersStr,
    queryParameters: queryParametersStr,
    pathParametersComment,
    queryParametersComment
  };
};

export const transformApiMethods = async (
  apiMethod: ApiMethod,
  options: {
    document: OpenAPIDocument;
    config: GeneratorConfig;
    map?: Array<[string, any]>;
  }
) => {
  const { handleApi } = options.config;
  if (!handleApi || typeof handleApi !== 'function') {
    return apiMethod;
  }
  const { apiDescriptor, apiInfo } = apiMethod2ApiDescriptor(apiMethod, options);
  let newApiDescriptor: ApiDescriptor | void | undefined | null = cloneDeep(apiDescriptor);

  try {
    newApiDescriptor = handleApi(newApiDescriptor);
  } catch {}
  // TODO:插件处理handleApi
  if (!newApiDescriptor) {
    return null;
  }
  const newApiMethod = apiDescriptor2apiMethod(newApiDescriptor, {
    oldApiInfo: apiInfo,
    operationObject: apiMethod.operationObject
  });

  newApiMethod.operationObject = mergeObject<OperationObject>(
    apiMethod.operationObject,
    newApiMethod.operationObject,
    options.document,
    options.map
  );

  return newApiMethod;
};

export const apiMethod2ApiDescriptor = (
  apiMethod: ApiMethod,
  options: {
    document: OpenAPIDocument;
    config: GeneratorConfig;
  }
) => {
  const { url, method } = apiMethod;
  const { document, config } = options;
  const operationObject = cloneDeep(apiMethod.operationObject);
  const { requestBody, responses, parameters } = operationObject;
  const apiDescriptor: ApiDescriptor = {
    ...operationObject,
    requestBody: {},
    responses: {},
    parameters: [],
    url,
    method
  };
  const successKey = getResponseSuccessKey(responses);
  const responseSuccess = responses?.[successKey];
  let requestBodyObject = requestBody as RequestBodyObject;
  let responseObject = responseSuccess as ResponseObject;
  let requestKey = 'application/json';
  let responseKey = 'application/json';
  if (parameters) {
    apiDescriptor.parameters = [];
    parameters.forEach(parameter => {
      apiDescriptor.parameters?.push(removeAll$ref<ParameterObject>(parameter, document));
    });
  }
  if (requestBody) {
    requestBodyObject = parseReference(requestBody, document, true);
    requestKey = getContentKey(requestBodyObject.content, config.bodyMediaType);
    apiDescriptor.requestBody = removeAll$ref(requestBodyObject.content?.[requestKey].schema ?? {}, document);
  }
  if (responseSuccess) {
    responseObject = parseReference(responseSuccess, document, true);
    responseKey = getContentKey(responseObject.content, config.responseMediaType);
    apiDescriptor.responses = removeAll$ref(responseObject.content?.[responseKey].schema ?? {}, document);
  }
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
      hasParameters: !!parameters
    }
  };
};
export const apiDescriptor2apiMethod = (
  apiDescriptor: ApiDescriptor,
  options: {
    operationObject: OperationObject;
    oldApiInfo: {
      successKey: string;
      requestKey: string;
      responseKey: string;
      hasResponse: boolean;
      hasRequestBody: boolean;
      hasParameters: boolean;
      requestBody: RequestBodyObject;
      response: ResponseObject;
    };
  }
) => {
  const apiDescriptorValue = cloneDeep(apiDescriptor);
  const operationObject = cloneDeep(options.operationObject);
  const { url, method } = apiDescriptorValue;
  const { successKey, requestKey, responseKey, hasResponse, hasParameters, hasRequestBody, requestBody, response } =
    options.oldApiInfo;
  if (!isEmpty(apiDescriptorValue.requestBody) || hasRequestBody) {
    operationObject.requestBody = requestBody || { content: {} };
    const { content } = operationObject.requestBody;
    if (!content[requestKey]) {
      content[requestKey] = {};
    }
    content[requestKey].schema = apiDescriptorValue.requestBody;
  }
  if (!isEmpty(apiDescriptorValue.responses) || hasResponse) {
    if (!operationObject.responses) {
      operationObject.responses = {};
    }
    operationObject.responses[successKey] = response || { content: {} };
    if (!operationObject.responses[successKey].content) {
      operationObject.responses[successKey].content = {};
    }
    const { content } = operationObject.responses[successKey];
    if (!content[responseKey]) {
      content[responseKey] = {};
    }
    content[responseKey].schema = apiDescriptorValue.responses;
  }
  if (!isEmpty(apiDescriptorValue.parameters) || hasParameters) {
    operationObject.parameters = apiDescriptorValue.parameters;
  }
  delete apiDescriptorValue.requestBody;
  delete apiDescriptorValue.responses;
  delete apiDescriptorValue.parameters;
  Object.assign(operationObject, apiDescriptorValue);
  return {
    url,
    method,
    operationObject
  } as ApiMethod;
};
