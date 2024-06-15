import { OpenAPIV3_1 } from 'openapi-types';
type Path = {
  key: string;
  method: string;
  path: string;
};
interface PropertiesInfoItem {
  key: string;
  type?: string;
  example?: string;
  enum?: string;
  deprecated?: boolean;
  description?: string;
}
interface SchemasInfoItem {
  title: string;
  description?: string;
  name: string;
  propertiesInfo: PropertiesInfoItem[];
}
interface TemplateData extends Omit<OpenAPIV3_1.Document, 'paths'> {
  // 定义模板数据类型
  // ...
  vue?: boolean;
  react?: boolean;
  defaultKey?: boolean;
  baseUrl: string;
  paths: Path[];
  schemasInfo: SchemasInfoItem[];
  commentText: string;
}
function isReferenceObject(
  obj: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject
): obj is OpenAPIV3_1.ReferenceObject {
  return !!(obj as OpenAPIV3_1.ReferenceObject).$ref;
}
function getType(type: string) {
  if ('integer' === type) {
    return 'number';
  }
  if (type === 'array') {
    return 'Array<any>';
  }
  return type;
}
export default async function openApi2Data(openApi: OpenAPIV3_1.Document): Promise<TemplateData> {
  // 处理openApi中的数据
  // ...
  const templateData: TemplateData = {
    ...openApi,
    baseUrl: '',
    paths: [],
    schemasInfo: [],
    commentText: ''
  };
  const schemas = openApi.components?.schemas || [];
  const refMap: Record<string, OpenAPIV3_1.SchemaObject> = {};
  const findBy$ref = (path: string) => {
    if (refMap[path]) {
      return refMap[path];
    }
    const pathArr = path.split('/');
    let find: any = {
      '#': openApi
    };
    pathArr.forEach(key => {
      if (find) {
        find = find[key];
      }
    });
    refMap[path] = find;

    return find as OpenAPIV3_1.SchemaObject;
  };
  for (const [schema, schemaInfo] of Object.entries(schemas)) {
    const propertiesInfo = [];
    refMap[`#/components/schemas/${schemas}`] = schemaInfo;
    if (!schemaInfo.properties) {
      continue;
    }
    for (const [key, value] of Object.entries(schemaInfo.properties)) {
      const infoValue = isReferenceObject(value) ? findBy$ref(value.$ref) : value;
      propertiesInfo.push({
        key,
        type: getType(infoValue?.type as string),
        example: infoValue?.example,
        enum: infoValue?.enum?.join?.('" | "'),
        deprecated: infoValue?.deprecated,
        description: infoValue?.description
      });
    }
    templateData.schemasInfo.push({
      title: (schemaInfo as any).title,
      description: (schemaInfo as any).description,
      name: schema,
      propertiesInfo
    });
  }
  const paths = openApi.paths || [];
  for (const [path, pathInfo] of Object.entries(paths)) {
    if (!pathInfo) {
      continue;
    }
    for (const [method, methodInfo] of Object.entries(pathInfo)) {
      if (['parameters'].includes(method)) {
        continue;
      }
      const methodFormat = method.toUpperCase();
      let key = '';
      if (typeof methodInfo === 'string') {
        key = methodInfo;
      } else if (Array.isArray(methodInfo)) {
        key = methodInfo.map(item => item.description)?.[0] || '';
      } else {
        key = `${methodInfo?.tags?.[0]}.${methodInfo.operationId}`;
      }
      templateData.paths.push({
        key,
        method: methodFormat,
        path
      });
    }
  }
  templateData.baseUrl = openApi.servers?.[0]?.url || '';
  return templateData;
}
