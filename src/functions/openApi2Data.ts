import { compile, JSONSchema } from 'json-schema-to-typescript';
import { cloneDeep } from 'lodash';
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { format, removeUndefined } from '../utils';
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
  responseName: string;
  requestName?: string;
  pathKey: string;
}
interface PathApis {
  tag: string;
  apis: Api[];
}
export interface TemplateData extends Omit<OpenAPIV3_1.Document, ''> {
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
  return !!(obj as OpenAPIV3.ReferenceObject)?.$ref;
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
    declareExternallyReferenced: false
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
export async function convertToType(
  schemaOrigin: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject,
  openApi: OpenAPIV3_1.Document,
  config: {
    deep?: boolean;
    defaultType?: 'any' | 'unknown';
    commentStyle?: 'line' | 'docment';
    preText?: string;
  } = {
    deep: true,
    defaultType: 'unknown',
    commentStyle: 'line',
    preText: ''
  }
): Promise<string> {
  if (!schemaOrigin) {
    return config.defaultType ?? 'unknown';
  }
  function parseSchema(
    schemaOrigin: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject,
    openApi: OpenAPIV3_1.Document
  ): string {
    let schema: OpenAPIV3_1.SchemaObject = schemaOrigin;
    if (isReferenceObject(schemaOrigin)) {
      if (!config.deep) {
        return get$refName(schemaOrigin.$ref);
      }
      schema = findBy$ref(schemaOrigin.$ref, openApi);
    }
    if (schema.enum) {
      return parseEnum(schema);
    }
    switch (schema.type) {
      case 'object':
        return parseObject(schema, openApi);
      case 'array':
        return parseArray(schema, openApi);
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
        if (schema.oneOf) {
          return schema.oneOf.map(item => parseSchema(item, openApi)).join(' | ');
        }
        return typeof schema.type === 'string'
          ? (schema.type || config.defaultType) ?? 'unknown'
          : config.defaultType ?? 'unknown';
    }
  }
  function comment(type: 'line' | 'docment') {
    const startText = type === 'docment' ? '/**\n' : '';
    const endText = type === 'docment' ? '\n */\n' : '\n';
    let str = '';
    let idx = 0;
    const preText = type === 'docment' ? ' *' : '//';
    return {
      add(text: string) {
        if (idx) {
          str += '\n';
        }
        str += text
          .split('\n')
          .map(item => `${preText} ${item}`)
          .join('\n');
        idx++;
      },
      end() {
        if (!str) {
          return str;
        }
        return startText + str + endText;
      }
    };
  }
  function parseObject(schema: OpenAPIV3_1.SchemaObject, openApi: OpenAPIV3_1.Document): string {
    const properties = schema.properties || {};
    const required = new Set(schema.required ?? []);
    const lines: string[] = [`{`];
    for (const [key, valueOrigin] of Object.entries(properties)) {
      const optionalFlag = required.has(key) ? '' : '?';
      const value = isReferenceObject(valueOrigin) ? findBy$ref(valueOrigin.$ref, openApi) : valueOrigin;
      const type = parseSchema(valueOrigin, openApi);
      let valueStr = '';
      const doc = comment(config.commentStyle ?? 'line');
      if (value.description) {
        doc.add(value.description);
      }
      if (required.has(key)) {
        doc.add('[required]');
      }
      if (value.deprecated) {
        doc.add('[deprecated]');
      }
      valueStr = doc.end() + `${key}${optionalFlag}: ${type};`;
      valueStr.split('\n').forEach(line => lines.push(' ' + line));
    }
    lines.push(`}`);
    return lines.length > 2 ? lines.join('\n') : 'object';
  }

  function parseArray(schema: OpenAPIV3_1.ArraySchemaObject, openApi: OpenAPIV3_1.Document): string {
    if (Array.isArray(schema.items)) {
      const types = schema.items.map(item => parseSchema(item, openApi));
      return `[\n${types.map(type => `${type},\n`)}\n]`;
    } else if (schema.items) {
      let items: OpenAPIV3_1.SchemaObject = schema.items;
      if (isReferenceObject(schema.items)) {
        if (!config.deep) {
          return `${get$refName(schema.items.$ref)}[]`;
        }
        items = findBy$ref(schema.items.$ref, openApi);
      }
      const type = parseSchema(items, openApi);
      switch (items.type) {
        case 'object':
          return `Array<${type}>`;
        case 'array':
          return `${type}[]`;
        default:
          break;
      }
      if (items.oneOf || items.enum) {
        return `(${type})[]`;
      }
      return `${type}[]`;
    }
    return '[]';
  }

  function parseEnum(schema: OpenAPIV3_1.SchemaObject): string {
    return schema.enum?.map?.((value: any) => JSON.stringify(value))?.join?.(' | ') || '';
  }
  const tsStr = parseSchema(schemaOrigin, openApi);
  // 格式化ts类型
  const tsStrFormat = await format(`type Ts = ${tsStr}`, {
    semi: false // 去掉分号
  });
  const resultFormat = /type Ts = (.*)/s.exec(tsStrFormat)?.[1] ?? '';
  const tsStrArr = resultFormat.trim().split('\n');
  // 加前缀，便于生成注释
  return tsStrArr.map((line, idx) => (idx ? config.preText : '') + line).join('\n');
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
const removeSchemas$ref = <T = OpenAPIV3_1.SchemaObject>(schemaOrigin: any, openApi: OpenAPIV3_1.Document) => {
  let schema: OpenAPIV3_1.SchemaObject & Record<string, any>;
  if (isReferenceObject(schemaOrigin)) {
    schema = cloneDeep(findBy$ref<OpenAPIV3_1.SchemaObject>(schemaOrigin.$ref, openApi));
  } else {
    schema = cloneDeep(schemaOrigin);
  }
  for (const key of Object.keys(schema)) {
    if (schema[key] && typeof schema[key] == 'object') {
      schema[key] = removeSchemas$ref(schema[key], openApi);
    }
  }
  return schema as T;
};
const remove$ref = async (
  originObj: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject,
  openApi: OpenAPIV3_1.Document,
  schemasMap?: Map<string, string>,
  preText: string = ''
): Promise<string> => {
  const obj = cloneDeep(originObj);
  if (isReferenceObject(obj)) {
    const data = findBy$ref(obj.$ref, openApi);
    const type = get$refName(obj.$ref);
    if (schemasMap && !schemasMap.has(type)) {
      await jsonSchema2TsStr(data, type, openApi, { export: true }).then(schema => {
        schemasMap.set(type, schema);
      });
    }
    await remove$ref(data, openApi, schemasMap);
    return type;
  }

  if (typeof obj === 'object' && obj) {
    const keyArr = Object.keys(obj) as UnionToTuple<keyof OpenAPIV3_1.SchemaObject>;
    for (const key of keyArr) {
      if (typeof obj[key] === 'object' && ['items', 'properties'].includes(key)) {
        for (const value of Object.values(obj[key])) {
          if (typeof value !== 'object' || !value) {
            continue;
          }
          (value as any).type = await remove$ref(value, openApi, schemasMap);
        }
      }
    }
  }
  return await convertToType(obj, openApi, { deep: false, commentStyle: 'docment', preText });
};
const parseResponse = async (
  responses: OpenAPIV3_1.ResponsesObject,
  openApi: OpenAPIV3_1.Document,
  config: GeneratorConfig,
  schemasMap: Map<string, string>
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
  const responseName = await remove$ref(responseSchema, openApi, schemasMap);
  return {
    responseName,
    responseComment: await convertToType(responseSchema, openApi, { deep: true, preText: '* ' })
  };
};
const parseRequestBody = async (
  requestBody: OpenAPIV3_1.RequestBodyObject | OpenAPIV3_1.ReferenceObject | undefined,
  openApi: OpenAPIV3_1.Document,
  config: GeneratorConfig,
  schemasMap: Map<string, string>
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
  const requestName = await remove$ref(requestBodySchema, openApi, schemasMap);
  return {
    requestName,
    requestComment: await convertToType(requestBodySchema, openApi, { deep: true, preText: '* ' })
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
  schemasMap: Map<string, string>
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
    pathParametersStr = await remove$ref(pathParameters, openApi, schemasMap);
    pathParametersComment = await convertToType(pathParameters, openApi, { deep: true, preText: '       * ' });
  }
  if (Object.keys(queryParameters.properties ?? {}).length) {
    queryParametersStr = await remove$ref(queryParameters, openApi, schemasMap);
    queryParametersComment = await convertToType(queryParameters, openApi, { deep: true, preText: '       * ' });
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
  pathObj: OpenAPIV3_1.OperationObject,
  openApi: OpenAPIV3_1.Document,
  config: GeneratorConfig
) => {
  const handleApi = config.handleApi;
  if (!handleApi || typeof handleApi !== 'function') {
    return { ...pathObj, url, method };
  }
  const { requestBody, responses, parameters } = pathObj;
  const apiDescriptor: ApiDescriptor = {
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
    const apiParameters = parameters;
    apiDescriptor.parameters = [];
    const parametersArray = isReferenceObject(apiParameters)
      ? findBy$ref<typeof apiParameters>(apiParameters.$ref, openApi)
      : apiParameters ?? [];
    for (const parameter of parametersArray) {
      const parameterObject = await removeSchemas$ref<OpenAPIV3.ParameterObject>(parameter, openApi);
      const schema = (parameterObject.schema ?? {}) as OpenAPIV3_1.SchemaObject;
      apiDescriptor.parameters.push({
        ...parameterObject,
        ...schema,
        examples: schema.examples,
        required: schema.required,
        paramsRequired: parameterObject.required,
        paramsExamples: parameterObject.examples
      });
    }
  }
  if (requestBody) {
    requestBodyObject = isReferenceObject(requestBody) ? findBy$ref(requestBody.$ref, openApi) : requestBody;
    requestKey = getContentKey(requestBodyObject.content || {}, config.bodyMediaType);
    const requestBodySchema = requestBodyObject.content?.[requestKey].schema ?? {};
    const requestBodySchemaObj = removeSchemas$ref<OpenAPIV3_1.SchemaObject>(requestBodySchema, openApi);
    apiDescriptor.requestBody = requestBodySchemaObj;
  }
  if (response200) {
    responseObject = isReferenceObject(response200) ? findBy$ref(response200.$ref, openApi) : response200;
    responseKey = getContentKey(responseObject.content || {}, config.responseMediaType);
    const responseSchema = responseObject.content?.[responseKey].schema ?? {};
    const responseSchemaObj = removeSchemas$ref<OpenAPIV3_1.SchemaObject>(responseSchema, openApi);
    apiDescriptor.responses = responseSchemaObj;
  }
  let newApiDescriptor = apiDescriptor;
  let handleApiDone = false;
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
  if (apiDescriptor.requestBody && requestBody) {
    pathObj.requestBody = requestBodyObject;
    pathObj.requestBody.content[requestKey].schema = apiDescriptor.requestBody;
  }
  if (apiDescriptor.responses && pathObj.responses?.['200'] && responseObject.content) {
    pathObj.responses['200'] = responseObject;
    responseObject.content[responseKey].schema = apiDescriptor.responses;
  }
  if (apiDescriptor.parameters) {
    pathObj.parameters = apiDescriptor.parameters.map(parameter => {
      const { paramsExamples, paramsRequired, ...parameterSchema } = parameter;
      const pathParamter = {
        ...parameterSchema,
        schema: parameterSchema as OpenAPIV3_1.ParameterObject['schema'],
        required: paramsRequired,
        examples: paramsExamples
      };
      return pathParamter;
    });
  }
  delete apiDescriptor.requestBody;
  delete apiDescriptor.responses;
  delete apiDescriptor.parameters;
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
        const { queryParameters, queryParametersComment, pathParameters, pathParametersComment } =
          await parseParameters(methodInfo.parameters, openApi, config, schemasMap);
        const { responseName, responseComment } = await parseResponse(
          methodInfo.responses,
          openApi,
          config,
          schemasMap
        );
        const { requestName, requestComment } = await parseRequestBody(
          methodInfo.requestBody,
          openApi,
          config,
          schemasMap
        );
        const api: Api = {
          method: methodFormat,
          summary: methodInfo.summary ?? '',
          path,
          name: methodInfo.operationId || '',
          responseName,
          requestName,
          pathKey,
          queryParameters,
          queryParametersComment,
          pathParameters,
          pathParametersComment,
          responseComment,
          requestComment
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
  templateData.schemas = [...new Set(schemasMap.values())];
  return removeUndefined(templateData);
}
