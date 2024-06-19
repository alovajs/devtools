import { compile, JSONSchema } from 'json-schema-to-typescript';
import { cloneDeep } from 'lodash';
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
type Path = {
  key: string;
  method: string;
  path: string;
};
type renderItem = {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  key?: string;
  type: string;
};
interface Api {
  method: string;
  summary: string;
  path: string;
  pathParameters: renderItem[];
  queryParameters: renderItem[];
  response: renderItem[] | renderItem;
  requestBody?: renderItem[] | renderItem;
  name: string;
  responseName: string;
  requestName?: string;
  pathKey: string;
}
interface PathApis {
  tag: string;
  apis: Api[];
}
interface TemplateData extends Omit<OpenAPIV3_1.Document, ''> {
  // 定义模板数据类型
  // ...
  vue?: boolean;
  react?: boolean;
  defaultKey?: boolean;
  baseUrl: string;
  pathsArr: Path[];
  schemas?: string[];
  pathApis: PathApis[];
  commentText: string;
}
function isReferenceObject(obj: any): obj is OpenAPIV3.ReferenceObject {
  return !!(obj as OpenAPIV3.ReferenceObject).$ref;
}

const removeTitle = (obj: any) => {
  if (typeof obj !== 'object') {
    return obj;
  }
  for (const key in obj) {
    if (key === 'title') {
      obj.description = obj[key] ? `${obj[key]}\n---\n${obj.description}` : obj.description;
      delete obj[key];
    }
    if (typeof obj[key] === 'object') {
      removeTitle(obj[key]);
    }
  }
  return obj;
};
const jsonSchema2TsStr = async (
  schema: OpenAPIV3_1.SchemaObject | JSONSchema,
  name: string,
  openApi: OpenAPIV3_1.Document,
  options: { export?: boolean } = { export: false }
) => {
  const tsStr = await compile(removeTitle(cloneDeep({ ...schema, components: openApi.components })), name, {
    bannerComment: '',
    additionalProperties: false,
    declareExternallyReferenced: true
  });
  const transformer = () => {
    let result = tsStr;
    if (!options.export) {
      result = result.replace(/export(\s)+/g, '');
    }

    return tsStr;
  };
  return transformer();
};
function convertToType(schema: JSONSchema): string {
  if (!schema) {
    return 'string';
  }
  function parseSchema(schema: JSONSchema): string {
    switch (schema.type) {
      case 'object':
        return parseObject(schema);
      case 'array':
        return parseArray(schema);
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'null':
        return 'null';
      default:
        if (schema.enum) {
          return parseEnum(schema);
        }
        return typeof schema.type === 'string' ? schema.type ?? 'any' : 'any';
    }
  }

  function parseObject(schema: JSONSchema): string {
    const properties = schema.properties || {};
    const required = new Set(typeof schema?.required === 'boolean' ? [] : schema.required ?? []);
    const lines: string[] = [`{`];

    for (const [key, value] of Object.entries(properties)) {
      const optionalFlag = required.has(key) ? '' : '?';
      const type = parseSchema(value);
      lines.push(`  ${key}${optionalFlag}: ${type};`);
    }

    lines.push(`}`);
    return lines.length > 2 ? lines.join('\n') : 'object';
  }

  function parseArray(schema: JSONSchema): string {
    if (Array.isArray(schema.items)) {
      const types = schema.items.map(item => parseSchema(item));
      return `(${types.join(' | ')})[]`;
    } else if (schema.items) {
      const type = parseSchema(schema.items);
      return `${type}[]`;
    }
    return 'any[]';
  }

  function parseEnum(schema: JSONSchema): string {
    console.log(schema.enum, 136);

    return schema.enum?.map?.((value: any) => JSON.stringify(value))?.join?.(' | ') || '';
  }

  return parseSchema(schema);
}
/**
 *
 * @param path $ref查找路径
 * @param openApi openApi文档对象
 * @param refMap 缓存查找数据
 * @returns 查找到的SchemaObject
 */
const findBy$ref = <T = OpenAPIV3_1.SchemaObject>(path: string, openApi: OpenAPIV3_1.Document) => {
  const pathArr = path.split('/');
  let find: any = {
    '#': openApi
  };
  pathArr.forEach(key => {
    if (find) {
      find = find[key];
    }
  });
  return find as T;
};

const get$refName = (path: string) => {
  const pathArr = path.split('/');
  const nameArr = pathArr[pathArr.length - 1].split('');
  return (nameArr?.[0]?.toUpperCase?.() ?? '') + nameArr.slice(1).join('');
};
const remove$ref = async <T = any>(
  originObj: any,
  openApi: OpenAPIV3_1.Document,
  schemasMap?: Map<string, string>
): Promise<[T, string]> => {
  const obj = cloneDeep(originObj);
  if (isReferenceObject(obj)) {
    const data = findBy$ref<T>(obj.$ref, openApi);
    const jsonschema: JSONSchema = (data as any)?.schema ?? data;
    const type = get$refName(obj.$ref);
    if (schemasMap && !schemasMap.has(type)) {
      await jsonSchema2TsStr(jsonschema, type, openApi, { export: true }).then(schema => {
        schemasMap.set(type, schema);
      });
    }
    const [result] = await remove$ref(data, openApi, schemasMap);
    return [result, type];
  }
  if (typeof obj === 'object' && obj) {
    for (const key in obj) {
      if (key === 'schema' && obj) {
        const [result, type] = await remove$ref(obj[key], openApi, schemasMap);
        obj[key] = result;
        obj[key].type = ['any', 'object', 'null', undefined].includes(type) ? obj[key].type : type;
      }
      if (typeof obj[key] === 'object' && ['items', 'properties'].includes(key)) {
        for (const [k, value] of Object.entries(obj[key])) {
          if (typeof value !== 'object' || !value) {
            continue;
          }
          const [result, type] = await remove$ref(value, openApi, schemasMap);
          obj[key][k] = result;
          obj[key][k].type = ['any', 'object', 'null', undefined].includes(type) ? obj[key][k].type : type;
        }
      }
    }
  }
  delete obj.$ref;
  return [obj, convertToType(obj?.schema || obj)];
};
const parseResponse = async (
  responses: OpenAPIV3_1.ResponsesObject,
  openApi: OpenAPIV3_1.Document,
  config: GeneratorConfig,
  schemasMap: Map<string, string>
) => {
  const responseInfo = responses?.['200'];
  if (!responseInfo) {
    return [{ type: 'unknown' }, 'unknown'] as [renderItem, string];
  }
  const responseObject: OpenAPIV3_1.ResponseObject = isReferenceObject(responseInfo)
    ? findBy$ref(responseInfo.$ref, openApi)
    : responseInfo;
  const key = getContentKey(responseObject.content ?? {}, config.responseMediaType);
  const responseSchema = responseObject?.content?.[key]?.schema ?? {};
  const [responseSchemaObj, responseName] = await remove$ref<OpenAPIV3_1.SchemaObject>(
    responseSchema,
    openApi,
    schemasMap
  );
  const response = responseSchemaObj.properties
    ? Object.entries(responseSchemaObj.properties as OpenAPIV3_1.SchemaObject).map(([key, value]) => {
        return {
          key: key + (!value.required ? '?' : ''),
          description: value.description || '',
          type: value?.type,
          required: !!value.required,
          deprecated: !!value.deprecated
        };
      })
    : { type: responseName };
  return [response, responseName] as [typeof response, string];
};
const parseRequestBody = async (
  requestBody: OpenAPIV3_1.RequestBodyObject | OpenAPIV3_1.ReferenceObject | undefined,
  openApi: OpenAPIV3_1.Document,
  config: GeneratorConfig,
  schemasMap: Map<string, string>
) => {
  if (!requestBody) {
    return [{ type: '' }, ''] as [renderItem, string];
  }
  const requestBodyObject: OpenAPIV3_1.RequestBodyObject = isReferenceObject(requestBody)
    ? findBy$ref(requestBody.$ref, openApi)
    : requestBody;
  const key = getContentKey(requestBodyObject.content, config.bodyMediaType);
  const requestBodySchema = requestBodyObject?.content?.[key]?.schema ?? {};
  const [requestBodySchemaObj, requestName] = await remove$ref<OpenAPIV3_1.SchemaObject>(
    requestBodySchema,
    openApi,
    schemasMap
  );
  const requestBodyInfo = requestBodySchemaObj.properties
    ? Object.entries(requestBodySchemaObj.properties as OpenAPIV3_1.SchemaObject).map(([key, value]) => {
        return {
          key: key + (!value.required ? '?' : ''),
          description: value.description || '',
          type: value?.type,
          required: !!value.required,
          deprecated: !!value.deprecated
        };
      })
    : { type: requestName };
  return [requestBodyInfo, requestName] as [typeof requestBodyInfo, string];
};
const getContentKey = (content: Record<string, any>, requireKey: string, defaultKey = 'application/json') => {
  let key = Object.keys(content ?? {})[0];
  if (requireKey && content?.[requireKey]) {
    key = requireKey;
  }
  key = key ?? defaultKey;
  return key;
};
export const transformPathObj = async (
  url: string,
  method: string,
  pathObj: OpenAPIV3_1.OperationObject,
  openApi: OpenAPIV3_1.Document,
  config: GeneratorConfig
) => {
  const handleApi = config.handleApi;
  if (!handleApi || typeof handleApi !== 'function') {
    return { ...pathObj, url, method };
  }
  const { requestBody, responses } = pathObj;
  const apiDescriptor: ApiDescriptor = {
    ...pathObj,
    url,
    method
  };
  const response200 = responses?.['200'];
  let requestBodyObject = requestBody as OpenAPIV3_1.RequestBodyObject;
  let responseObject = response200 as OpenAPIV3_1.ResponseObject;
  let requestKey = '';
  let responseKey = '';
  if (apiDescriptor.parameters) {
    const apiParameters = apiDescriptor.parameters;
    apiDescriptor.parameters = [];
    const parameters = isReferenceObject(apiParameters)
      ? findBy$ref<typeof apiParameters>(apiParameters.$ref, openApi)
      : apiParameters;
    for (const parameter of parameters) {
      const [parameterObject] = await remove$ref<OpenAPIV3.ParameterObject>(parameter, openApi);
      apiDescriptor.parameters.push(parameterObject);
    }
  }
  if (requestBody) {
    requestBodyObject = isReferenceObject(requestBody) ? findBy$ref(requestBody.$ref, openApi) : requestBody;
    requestKey = getContentKey(requestBodyObject.content || {}, config.bodyMediaType);
    const requestBodySchema = requestBodyObject.content?.[requestKey].schema ?? {};
    const [requestBodySchemaObj] = await remove$ref<OpenAPIV3_1.SchemaObject>(requestBodySchema, openApi);
    apiDescriptor.requestData = requestBodySchemaObj;
  }
  if (response200) {
    responseObject = isReferenceObject(response200) ? findBy$ref(response200.$ref, openApi) : response200;
    responseKey = getContentKey(responseObject.content || {}, config.responseMediaType);
    const responseSchema = responseObject.content?.[responseKey].schema ?? {};
    const [responseSchemaObj] = await remove$ref<OpenAPIV3_1.SchemaObject>(responseSchema, openApi);
    apiDescriptor.response = responseSchemaObj;
  }
  let newApiDescriptor = apiDescriptor;
  let handleApiDone = false;
  console.log(apiDescriptor, 333);
  try {
    newApiDescriptor = handleApi(apiDescriptor);
    handleApiDone = true;
  } catch (error) {
    handleApiDone = false;
    console.log(error);
  }
  if (!handleApiDone) {
    return { ...pathObj, url, method };
  }
  if (!newApiDescriptor) {
    return null;
  }
  Object.assign(apiDescriptor, newApiDescriptor);
  if (apiDescriptor.requestData && requestBody) {
    pathObj.requestBody = requestBodyObject;
    pathObj.requestBody.content[requestKey].schema = apiDescriptor.requestData;
  }
  if (apiDescriptor.response && pathObj.responses?.['200'] && responseObject.content) {
    pathObj.responses['200'] = responseObject;
    responseObject.content[responseKey].schema = apiDescriptor.response;
  }
  delete apiDescriptor.requestData;
  delete apiDescriptor.response;
  Object.assign(pathObj, apiDescriptor);
  return {
    ...pathObj,
    url: apiDescriptor.url,
    method: apiDescriptor.method
  };
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
    schemas: []
  };
  const schemas = openApi.components?.schemas || [];
  const schemasMap = new Map<string, string>();
  for (const [schema, schemaInfo] of Object.entries(schemas)) {
    const tsStr = await jsonSchema2TsStr(schemaInfo, schema, openApi, { export: true });
    schemasMap.set(schema, tsStr);
  }
  const paths = openApi.paths || [];
  for (const [url, pathInfo] of Object.entries(paths)) {
    if (!pathInfo) {
      continue;
    }
    for (const [method, methodInfo] of Object.entries(pathInfo)) {
      if (!['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'].includes(method)) {
        continue;
      }
      if (typeof methodInfo === 'string' || Array.isArray(methodInfo)) {
        continue;
      }
      const newMethodInfo = await transformPathObj(url, method, methodInfo, openApi, config);
      if (!newMethodInfo) {
        continue;
      }
      const { url: path, method: newMethod } = newMethodInfo;
      Object.assign(methodInfo, newMethodInfo);
      const methodFormat = newMethod.toUpperCase();
      const allPromise = methodInfo.tags?.map(async tag => {
        const pathKey = `${tag}.${methodInfo.operationId}`;
        const pathParameters: renderItem[] = [];
        const queryParameters: renderItem[] = [];
        for (const refParameter of methodInfo.parameters || []) {
          const [parameter, type] = await remove$ref<OpenAPIV3.ParameterObject>(refParameter, openApi, schemasMap);
          if (parameter.in === 'path') {
            pathParameters.push({
              key: parameter.name + (!parameter.required ? '?' : ''),
              description: parameter.description || '',
              type,
              required: !!parameter.required,
              deprecated: !!parameter.deprecated
            });
          }
          if (parameter.in === 'query') {
            queryParameters.push({
              key: parameter.name + (!parameter.required ? '?' : ''),
              description: parameter.description || '',
              type,
              required: !!parameter.required,
              deprecated: !!parameter.deprecated
            });
          }
        }
        const [response, responseName] = await parseResponse(methodInfo.responses, openApi, config, schemasMap);
        const [requestBody, requestName] = await parseRequestBody(methodInfo.requestBody, openApi, config, schemasMap);
        const api: Api = {
          method: methodFormat,
          summary: methodInfo.summary ?? '',
          path,
          name: methodInfo.operationId || '',
          responseName,
          requestName,
          pathKey,
          pathParameters,
          queryParameters,
          response,
          requestBody
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
        tagApis.apis.push(api);
      });
      if (allPromise) {
        await Promise.all(allPromise);
      }
    }
  }
  templateData.baseUrl = openApi.servers?.[0]?.url || '';
  templateData.schemas = [...schemasMap.values()];
  return templateData;
}
