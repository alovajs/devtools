import { compile, JSONSchema } from 'json-schema-to-typescript';
import { cloneDeep } from 'lodash';
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
type Path = {
  key: string;
  method: string;
  path: string;
};
type renderItem = {
  description: string;
  required: boolean;
  deprecated: boolean;
  key: string;
  type: string;
};
interface Api {
  method: string;
  summary: string;
  path: string;
  pathParameters: renderItem[];
  queryParameters: renderItem[];
  response: renderItem[];
  name: string;
  responseName: string;
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
        return 'any';
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
    return lines.join(' ');
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
const remove$ref = <T = any>(obj: any, openApi: OpenAPIV3_1.Document, schemas: string[] = []): [T, string] => {
  if (isReferenceObject(obj)) {
    const data = findBy$ref<T>(obj.$ref, openApi);
    const jsonschema: JSONSchema = (data as any)?.schema ?? data;
    const type = get$refName(obj.$ref);
    jsonSchema2TsStr(jsonschema, type, openApi, { export: true }).then(schema => {
      if (schemas.includes(schema)) {
        return;
      }
      schemas.push(schema);
    });
    return [data, type];
  }
  if (typeof obj === 'object' && obj) {
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        [obj[key]] = remove$ref(obj[key], openApi);
      }
    }
  }
  delete obj.$ref;
  return [obj, convertToType(obj?.schema || obj)];
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
  for (const [schema, schemaInfo] of Object.entries(schemas)) {
    const tsStr = await jsonSchema2TsStr(schemaInfo, schema, openApi, { export: true });
    templateData.schemas?.push(tsStr);
  }
  const paths = openApi.paths || [];
  for (const [path, pathInfo] of Object.entries(paths)) {
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
      const methodFormat = method.toUpperCase();
      methodInfo.tags?.forEach(async tag => {
        const pathKey = `${tag}.${methodInfo.operationId}`;
        const pathParameters: renderItem[] = [];
        const queryParameters: renderItem[] = [];
        methodInfo.parameters?.forEach(refParameter => {
          const [parameter, type] = remove$ref<OpenAPIV3.ParameterObject>(refParameter, openApi, templateData.schemas);
          if (parameter.in === 'path') {
            pathParameters.push({
              key: parameter.name,
              description: parameter.description || '',
              type,
              required: !!parameter.required,
              deprecated: !!parameter.deprecated
            });
          }
          if (parameter.in === 'query') {
            queryParameters.push({
              key: parameter.name,
              description: parameter.description || '',
              type,
              required: !!parameter.required,
              deprecated: !!parameter.deprecated
            });
          }
        });
        const responseInfo = methodInfo.responses?.['200'];
        const responseObject: OpenAPIV3_1.ResponseObject = isReferenceObject(responseInfo)
          ? findBy$ref(responseInfo.$ref, openApi)
          : responseInfo;
        const key = config.responseMediaType ?? Object.keys(responseObject.content ?? {})[0] ?? 'application/json';
        const responseSchema = responseObject?.content?.[key]?.schema ?? {};
        const [response, responseName] = remove$ref<OpenAPIV3_1.SchemaObject>(
          responseSchema,
          openApi,
          templateData.schemas
        );

        const api: Api = {
          method: methodFormat,
          summary: methodInfo.summary ?? '',
          path,
          name: methodInfo.operationId || '',
          responseName,
          pathKey,
          pathParameters,
          queryParameters,
          response: Object.entries((response.properties ?? {}) as OpenAPIV3_1.SchemaObject).map(([key, value]) => {
            return {
              key,
              description: value.description || '',
              type: value?.type,
              required: !!value.required,
              deprecated: !!value.deprecated
            };
          })
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
    }
  }
  templateData.baseUrl = openApi.servers?.[0]?.url || '';
  return templateData;
}
