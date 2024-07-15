import { findBy$ref, get$refName, isReferenceObject, mergeObject, removeAll$ref } from '@/helper/openapi';
import { convertToType, jsonSchema2TsStr } from '@/helper/schema2type';
import { getStandardOperationId, getStandardTags } from '@/helper/standard';
import { generateDefaultValues } from '@/helper/typeStr';
import { format, removeUndefined } from '@/utils';
import { cloneDeep } from 'lodash';
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { AlovaVersion } from './getAlovaVersion';

type Path = {
  key: string;
  method: string;
  path: string;
};
export interface Api {
  method: string;
  summary: string;
  path: string;
  pathParameters: string;
  queryParameters: string;
  pathParametersComment?: string;
  queryParametersComment?: string;
  responseComment?: string;
  requestComment?: string;
  name: string;
  global: string;
  responseName: string;
  requestName?: string;
  defaultValue?: string;
  pathKey: string;
}
interface PathApis {
  tag: string;
  apis: Api[];
}
export const getApiDefultValue = (api: Api) => {
  const configStrArr: string[] = [];
  if (api.pathParametersComment) {
    configStrArr.push(`pathParams: ${generateDefaultValues(api.pathParametersComment.replaceAll('*', ''))}`);
  }
  if (api.queryParametersComment) {
    configStrArr.push(`params: ${generateDefaultValues(api.queryParametersComment.replaceAll('*', ''))}`);
  }
  if (api.requestComment) {
    configStrArr.push(`data: ${generateDefaultValues(api.requestComment.replaceAll('*', ''))}`);
  }
  return format(`${api.global}.${api.pathKey}({${configStrArr.join(',\n')}})`, {
    printWidth: 40, // 缩短printWidth以强制换行
    tabWidth: 2,
    semi: false, // 去掉末尾分号
    useTabs: false,
    trailingComma: 'none',
    endOfLine: 'lf',
    bracketSpacing: true,
    arrowParens: 'always'
  });
};
export interface TemplateData extends Omit<OpenAPIV3_1.Document, ''> {
  // 定义模板数据类型
  // ...
  vue?: boolean;
  react?: boolean;
  moduleType?: 'commonJs' | 'ESModule';
  defaultKey?: boolean;
  baseUrl: string;
  pathsArr: Path[];
  schemas?: string[];
  pathApis: PathApis[];
  global: string;
  alovaVersion: AlovaVersion;
  commentText: string;
}
const remove$ref = (
  originObj: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject,
  openApi: OpenAPIV3_1.Document,
  schemasMap?: Map<string, string>,
  preText: string = '',
  searchMap: Map<string, string> = new Map(),
  map: Map<string, string> = new Map()
): Promise<string> =>
  convertToType(originObj, openApi, {
    deep: false,
    commentStyle: 'docment',
    preText,
    searchMap,
    on$Ref(refOject) {
      const type = get$refName(refOject.$ref);
      if (schemasMap && !schemasMap.has(type)) {
        jsonSchema2TsStr(
          refOject,
          type,
          openApi,
          {
            export: true,
            on$RefTsStr(name, tsStr) {
              schemasMap.set(name, tsStr);
            }
          },
          searchMap,
          map
        ).then(schema => {
          schemasMap.set(type, schema);
        });
      }
    }
  });
const parseResponse = async (
  responses: OpenAPIV3_1.ResponsesObject | undefined,
  openApi: OpenAPIV3_1.Document,
  config: GeneratorConfig,
  schemasMap: Map<string, string>,
  searchMap: Map<string, string>,
  removeMap: Map<string, string>
) => {
  const responseInfo = responses?.['200'];
  if (!responseInfo) {
    return {
      responseName: 'unknown',
      responseComment: 'unknown'
    };
  }
  const responseObject: OpenAPIV3_1.ResponseObject = isReferenceObject(responseInfo)
    ? findBy$ref(responseInfo.$ref, openApi)
    : responseInfo;
  const key = getContentKey(responseObject.content ?? {}, config.responseMediaType);
  const responseSchema = responseObject?.content?.[key]?.schema ?? {};
  const responseName = await remove$ref(responseSchema, openApi, schemasMap, '', removeMap);
  return {
    responseName,
    responseComment: await convertToType(responseSchema, openApi, { deep: true, preText: '* ', searchMap })
  };
};
const parseRequestBody = async (
  requestBody: OpenAPIV3_1.RequestBodyObject | OpenAPIV3_1.ReferenceObject | undefined,
  openApi: OpenAPIV3_1.Document,
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
  const requestBodyObject: OpenAPIV3_1.RequestBodyObject = isReferenceObject(requestBody)
    ? findBy$ref(requestBody.$ref, openApi)
    : requestBody;
  const key = getContentKey(requestBodyObject.content, config.bodyMediaType);
  const requestBodySchema = requestBodyObject?.content?.[key]?.schema ?? {};
  const requestName = await remove$ref(requestBodySchema, openApi, schemasMap, '', removeMap);
  return {
    requestName,
    requestComment: await convertToType(requestBodySchema, openApi, { deep: true, preText: '* ', searchMap })
  };
};
const getContentKey = (content: Record<string, any>, requireKey: string, defaultKey = 'application/json') => {
  let key = Object.keys(content ?? {})[0];
  if (requireKey && content?.[requireKey]) {
    key = requireKey;
  }
  key = key ?? defaultKey;
  return key;
};
const parseParameters = async (
  parameters: (OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject)[] | undefined,
  openApi: OpenAPIV3_1.Document,
  config: GeneratorConfig,
  schemasMap: Map<string, string>,
  searchMap: Map<string, string>,
  removeMap: Map<string, string>
) => {
  const pathParameters: OpenAPIV3_1.SchemaObject = {
    type: 'object'
  };
  const queryParameters: OpenAPIV3_1.SchemaObject = {
    type: 'object'
  };
  for (const refParameter of parameters || []) {
    const parameter = isReferenceObject(refParameter)
      ? findBy$ref<OpenAPIV3.ParameterObject>(refParameter.$ref, openApi)
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
    pathParametersStr = await remove$ref(pathParameters, openApi, schemasMap, '', removeMap);
    pathParametersComment = await convertToType(pathParameters, openApi, {
      deep: true,
      preText: '* ',
      searchMap
    });
  }
  if (Object.keys(queryParameters.properties ?? {}).length) {
    queryParametersStr = await remove$ref(queryParameters, openApi, schemasMap, '', removeMap);
    queryParametersComment = await convertToType(queryParameters, openApi, {
      deep: true,
      preText: '* ',
      searchMap
    });
  }
  return {
    pathParameters: pathParametersStr,
    queryParameters: queryParametersStr,
    pathParametersComment,
    queryParametersComment
  };
};
export const transformPathObj = async (
  url: string,
  method: string,
  pathObjOrigin: OpenAPIV3_1.OperationObject,
  openApi: OpenAPIV3_1.Document,
  config: GeneratorConfig
) => {
  const { handleApi } = config;
  const pathObj = cloneDeep(pathObjOrigin);
  if (!handleApi || typeof handleApi !== 'function') {
    return { ...pathObjOrigin, url, method };
  }
  const { requestBody, responses, parameters } = pathObj;
  let apiDescriptor: ApiDescriptor = {
    ...pathObj,
    requestBody: {},
    responses: {},
    parameters: [],
    url,
    method
  };
  const response200 = responses?.['200'];
  let requestBodyObject = requestBody as OpenAPIV3_1.RequestBodyObject;
  let responseObject = response200 as OpenAPIV3_1.ResponseObject;
  let requestKey = '';
  let responseKey = '';
  if (parameters) {
    apiDescriptor.parameters = [];
    const parametersArray = isReferenceObject(parameters)
      ? findBy$ref<typeof parameters>(parameters.$ref, openApi, true)
      : (parameters ?? []);
    for (const parameter of parametersArray) {
      const parameterObject = removeAll$ref<OpenAPIV3.ParameterObject>(parameter, openApi);
      apiDescriptor.parameters.push(parameterObject);
    }
  }
  if (requestBody) {
    requestBodyObject = isReferenceObject(requestBody) ? findBy$ref(requestBody.$ref, openApi, true) : requestBody;
    requestKey = getContentKey(requestBodyObject.content || {}, config.bodyMediaType);
    const requestBodySchema = requestBodyObject.content?.[requestKey].schema ?? {};
    const requestBodySchemaObj = removeAll$ref<OpenAPIV3_1.SchemaObject>(requestBodySchema, openApi);
    apiDescriptor.requestBody = requestBodySchemaObj;
  }
  if (response200) {
    responseObject = isReferenceObject(response200) ? findBy$ref(response200.$ref, openApi, true) : response200;
    responseKey = getContentKey(responseObject.content || {}, config.responseMediaType);
    const responseSchema = responseObject.content?.[responseKey].schema ?? {};
    const responseSchemaObj = removeAll$ref<OpenAPIV3_1.SchemaObject>(responseSchema, openApi);
    apiDescriptor.responses = responseSchemaObj;
  }
  let newApiDescriptor = apiDescriptor;
  let handleApiDone = false;
  try {
    newApiDescriptor = handleApi(apiDescriptor);
    handleApiDone = true;
  } catch (error) {
    handleApiDone = false;
  }
  if (!handleApiDone) {
    return { ...pathObj, url, method };
  }
  if (!newApiDescriptor) {
    return null;
  }
  apiDescriptor = cloneDeep(newApiDescriptor);
  if (apiDescriptor.requestBody && requestBody) {
    pathObj.requestBody = requestBodyObject;
    pathObj.requestBody.content[requestKey].schema = apiDescriptor.requestBody;
  }
  if (apiDescriptor.responses && pathObj.responses?.['200'] && responseObject.content) {
    pathObj.responses['200'] = responseObject;
    responseObject.content[responseKey].schema = apiDescriptor.responses;
  }
  if (apiDescriptor.parameters && parameters) {
    pathObj.parameters = apiDescriptor.parameters;
  }
  delete apiDescriptor.requestBody;
  delete apiDescriptor.responses;
  delete apiDescriptor.parameters;
  Object.assign(pathObj, apiDescriptor);
  const result = {
    ...mergeObject<OpenAPIV3_1.OperationObject>(pathObjOrigin, pathObj, openApi),
    url: apiDescriptor.url,
    method: apiDescriptor.method
  };
  return result;
};
export default async function openApi2Data(
  openApi: OpenAPIV3_1.Document,
  config: GeneratorConfig
): Promise<TemplateData> {
  // 处理openApi中的数据
  // ...
  const templateData: TemplateData = {
    ...openApi,
    baseUrl: '',
    pathsArr: [],
    pathApis: [],
    commentText: '',
    schemas: [],
    alovaVersion: 'v2',
    global: config.global ?? 'Apis'
  };
  const schemasMap = new Map<string, string>();
  const searchMap = new Map<string, string>();
  const removeMap = new Map<string, string>();
  const operationIdSet = new Set<string>();
  const paths = openApi.paths || [];
  for (const [url, pathInfo] of Object.entries(paths)) {
    if (!pathInfo) {
      continue;
    }
    for (const [method, methodInfoOrigin] of Object.entries(pathInfo)) {
      if (!['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(method)) {
        continue;
      }
      if (typeof methodInfoOrigin === 'string' || Array.isArray(methodInfoOrigin)) {
        continue;
      }
      methodInfoOrigin.operationId = getStandardOperationId(methodInfoOrigin, url, method, operationIdSet);
      methodInfoOrigin.tags = getStandardTags(methodInfoOrigin.tags);
      const newMethodInfo = await transformPathObj(url, method, methodInfoOrigin, openApi, config);
      if (!newMethodInfo) {
        continue;
      }
      const { url: path, method: newMethod, ...methodInfo } = newMethodInfo;
      const methodFormat = newMethod.toUpperCase();
      const allPromise = methodInfo.tags?.map(async tag => {
        try {
          const pathKey = `${tag}.${methodInfo.operationId}`;
          const { queryParameters, queryParametersComment, pathParameters, pathParametersComment } =
            await parseParameters(methodInfo.parameters, openApi, config, schemasMap, searchMap, removeMap);
          const { responseName, responseComment } = await parseResponse(
            methodInfo.responses,
            openApi,
            config,
            schemasMap,
            searchMap,
            removeMap
          );
          const { requestName, requestComment } = await parseRequestBody(
            methodInfo.requestBody,
            openApi,
            config,
            schemasMap,
            searchMap,
            removeMap
          );
          const api: Api = {
            method: methodFormat,
            summary: methodInfo.summary?.replaceAll('\n', '') ?? '',
            path,
            name: methodInfo.operationId ?? '',
            responseName,
            requestName,
            pathKey,
            queryParameters,
            queryParametersComment,
            pathParameters,
            pathParametersComment,
            responseComment,
            requestComment,
            global: templateData.global
          };
          templateData.pathsArr.push({
            key: pathKey,
            method: methodFormat,
            path
          });
          let tagApis = templateData.pathApis.find(item => item.tag === tag);
          if (!tagApis) {
            templateData.pathApis.push(
              (tagApis = {
                tag,
                apis: []
              })
            );
          }
          api.defaultValue = await getApiDefultValue(api);
          tagApis.apis.push(api);
        } catch (error) {
          console.log(error);
        }
      });
      if (allPromise) {
        await Promise.all(allPromise);
      }
    }
  }
  templateData.baseUrl = openApi.servers?.[0]?.url || '';
  templateData.schemas = [...new Set(schemasMap.values())];
  return removeUndefined(templateData);
}
