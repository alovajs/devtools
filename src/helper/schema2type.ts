import { format } from '@/utils';
import { OpenAPIV3_1 } from 'openapi-types';
import { findBy$ref, getStandardRefName, isReferenceObject } from './openapi';
import { isValidJSIdentifier } from './standard';

export interface Schema2TypeOptions {
  deep?: boolean; // 是否递归解析
  shallowDeep?: boolean; // 只有最外层是解析的
  defaultType?: 'any' | 'unknown'; // 未匹配的时的默认类型
  commentStyle?: 'line' | 'docment'; // 注释风格
  preText?: string; // 注释前缀
  searchMap: Map<string, string>;
  visited?: Set<string>;
  on$Ref?: (refOject: OpenAPIV3_1.ReferenceObject) => void;
}
/**
 * 生成注释字符串
 * @param type 注释风格
 * @returns 注释对象
 */
export function comment(type: 'line' | 'docment') {
  const startText = type === 'docment' ? '/**\n' : '';
  const endText = type === 'docment' ? '\n */\n' : '\n';
  let str = '';
  let idx = 0;
  const preText = type === 'docment' ? ' *' : '//';
  const docmentKeyArr = [['[deprecated]', '@deprecated']];
  const docmentTransformeKeyArr: Array<[string, (text: string) => string]> = [
    [
      '[title]',
      (text: string) => {
        const [, nextText = ''] = /\[title\](.*)/.exec(text) ?? [];
        return `${nextText.trim()}\n---`;
      }
    ]
  ];
  const transformeText = (text: string) => {
    text = text.trim();
    if (type === 'line') {
      return text;
    }
    const docmentTransformeFn = docmentTransformeKeyArr.find(item => text.startsWith(item[0]));
    if (docmentTransformeFn) {
      return docmentTransformeFn[1](text);
    }
    return docmentKeyArr.find(item => item[0] === text)?.[1] ?? text;
  };
  return {
    add(text: string) {
      if (idx) {
        str += '\n';
      }
      str += transformeText(text)
        .split('\n')
        .map(item => `${preText} ${item}`)
        .join('\n');
      idx += 1;
    },
    end() {
      if (!str) {
        return str;
      }
      /**
       * // console.log(str, 63);
       *
       */

      return startText + str.replace('*/*', '* / *').replace('/*', '/ *').replace('*/', '* /') + endText;
    }
  };
}
/**
 * 将schema解析为ts类型字符串
 * @param schemaOrigin schema对象
 * @param openApi openApi对象
 * @param config 配置项
 * @returns ts类型字符串
 */
function parseSchema(
  schemaOrigin: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject,
  openApi: OpenAPIV3_1.Document,
  config: Schema2TypeOptions
): string {
  let schema: OpenAPIV3_1.SchemaObject = schemaOrigin;
  let refPath = '';
  if (isReferenceObject(schemaOrigin)) {
    refPath = schemaOrigin.$ref;
    const nameType = getStandardRefName(schemaOrigin.$ref);
    if (config.visited?.has(refPath)) {
      return nameType;
    }
    config.visited?.add(refPath);
    if (!config.deep && !config.shallowDeep) {
      config.on$Ref?.(schemaOrigin);
      return nameType;
    }
    if (config.searchMap.has(schemaOrigin.$ref)) {
      return config.searchMap.get(schemaOrigin.$ref) as string;
    }
    config.on$Ref?.(schemaOrigin);
    config.shallowDeep = false;
    schema = findBy$ref(schemaOrigin.$ref, openApi);
  }
  let result: string;
  if (schema.enum) {
    result = parseEnum(schema);
    if (refPath) {
      config.searchMap.set(refPath, result);
    }
    return result;
  }
  switch (schema.type) {
    case 'object':
      result = parseObject(schema, openApi, config);
      break;
    case 'array':
      result = parseArray(schema, openApi, config);
      break;
    case 'string':
      result = 'string';
      break;
    case 'number':
    case 'integer':
      result = 'number';
      break;
    case 'boolean':
      result = 'boolean';
      break;
    case 'null':
      result = 'null';
      break;
    default:
      if (schema.oneOf) {
        result = schema.oneOf.map(item => parseSchema(item, openApi, config)).join(' | ');
      } else {
        result =
          typeof schema.type === 'string'
            ? ((schema.type || config.defaultType) ?? 'unknown')
            : (config.defaultType ?? 'unknown');
      }
  }
  if (refPath) {
    config.searchMap.set(refPath, result);
  }
  return result;
}
/**
 *将object类型的schema解析为ts类型字符串
 * @param schema schema对象
 * @param openApi openApi对象
 * @param config 配置项
 * @returns  ts类型字符串
 */
function parseObject(
  schema: OpenAPIV3_1.SchemaObject,
  openApi: OpenAPIV3_1.Document,
  config: Schema2TypeOptions
): string {
  const properties = schema.properties || {};
  const required = new Set(schema.required ?? []);
  const lines: string[] = [`{`];
  for (const [key, valueOrigin] of Object.entries(properties)) {
    const optionalFlag = required.has(key) ? '' : '?';
    let refPath = '';
    let value = valueOrigin as OpenAPIV3_1.SchemaObject;
    if (isReferenceObject(valueOrigin)) {
      refPath = valueOrigin.$ref;
      value = findBy$ref(valueOrigin.$ref, openApi);
    }
    let type = parseSchema(valueOrigin, openApi, config);
    if (!config.deep && refPath) {
      type = getStandardRefName(refPath);
    }
    let valueStr = '';
    const doc = comment(config.commentStyle ?? 'line');
    if (value.title) {
      doc.add(`[title] ${value.title}`);
    }
    if (value.description) {
      doc.add(value.description);
    }
    if (required.has(key)) {
      doc.add('[required]');
    }
    if (value.deprecated) {
      doc.add('[deprecated]');
    }
    const keyValue = key.trim();
    valueStr = `${doc.end()}${isValidJSIdentifier(keyValue) ? keyValue : `"${keyValue}"`}${optionalFlag}: ${type};`;
    valueStr.split('\n').forEach(line => lines.push(` ${line}`));
  }
  lines.push(`}`);
  if (lines.length > 2) {
    return lines.join('\n');
  }
  if (schema.additionalProperties && typeof schema.additionalProperties !== 'boolean') {
    return `Record<string,${parseSchema(schema.additionalProperties, openApi, config)}>`;
  }
  return 'object';
}
/**
 * 将array类型的schema解析为ts类型字符串
 * @param schema schema对象
 * @param openApi openApi对象
 * @param config 配置项
 * @returns ts类型字符串
 */
function parseArray(
  schema: OpenAPIV3_1.ArraySchemaObject,
  openApi: OpenAPIV3_1.Document,
  config: Schema2TypeOptions
): string {
  if (Array.isArray(schema.items)) {
    const types = schema.items.map(item => parseSchema(item, openApi, config));
    return `[\n${types.map(type => `${type},\n`)}\n]`;
  }
  if (schema.items) {
    let items = schema.items as OpenAPIV3_1.SchemaObject;
    let refPath = '';
    if (isReferenceObject(schema.items)) {
      items = findBy$ref(schema.items.$ref, openApi);
      refPath = schema.items.$ref;
    }
    const type = parseSchema(schema.items, openApi, config);
    if (!config.deep && refPath) {
      return `${getStandardRefName(refPath)}[]`;
    }
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
/**
 * 将enum类型的schema解析为ts类型字符串
 * @param schema schema对象
 * @returns ts类型字符串
 */
function parseEnum(schema: OpenAPIV3_1.SchemaObject): string {
  return schema.enum?.map?.((value: any) => JSON.stringify(value))?.join?.(' | ') || '';
}
/**
 * 将schema解析为格式化后的ts类型字符串
 * @param schemaOrigin schema对象
 * @param openApi openapi文档对象
 * @param config 配置项
 * @returns 格式化后的ts类型字符串
 */
export async function convertToType(
  schemaOrigin: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject,
  openApi: OpenAPIV3_1.Document,
  config: Schema2TypeOptions
): Promise<string> {
  if (!schemaOrigin) {
    return config.defaultType ?? 'unknown';
  }
  if (!config.visited) {
    config.visited = new Set();
  }
  const tsStr = parseSchema(schemaOrigin, openApi, config);
  // 格式化ts类型
  const tsStrFormat = await format(`type Ts = ${tsStr}`, {
    semi: false // 去掉分号
  });
  const resultFormat = /type Ts =(.*)/s.exec(tsStrFormat)?.[1] ?? '';
  const tsStrArr = resultFormat.trim().split('\n');
  // 加前缀，便于生成注释
  return tsStrArr.map((line, idx) => (idx ? config.preText : '') + line).join('\n');
}
interface JsonSchema2TsOptions {
  export?: boolean;
  on$RefTsStr?: (name: string, tsStr: string) => void;
}
/**
 * 将schema对象解析为ts类型字符串
 * @param schema schema对象
 * @param name 类型名称
 * @param openApi openapi文档对象
 * @param options 配置项
 * @returns interface Ts字符串
 */
export const jsonSchema2TsStr = async (
  schema: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject,
  name: string,
  openApi: OpenAPIV3_1.Document,
  options: JsonSchema2TsOptions = { export: false },
  searchMap: Map<string, string> = new Map(),
  map: Map<string, string> = new Map(),
  visited: Set<string> = new Set()
): Promise<string> => {
  const tsStr = await convertToType(schema, openApi, {
    shallowDeep: true,
    defaultType: 'unknown',
    commentStyle: 'docment',
    preText: '',
    searchMap,
    async on$Ref(refObject) {
      if (options.on$RefTsStr) {
        const name = getStandardRefName(refObject.$ref);
        if (map.has(name)) {
          options.on$RefTsStr(name, map.get(name) ?? '');
          return;
        }
        if (visited.has(refObject.$ref)) {
          return;
        }
        visited.add(refObject.$ref);
        const result = await jsonSchema2TsStr(
          findBy$ref(refObject.$ref, openApi),
          name,
          openApi,
          options,
          searchMap,
          map,
          visited
        );
        map.set(name, result);
        options.on$RefTsStr(name, result);
      }
    }
  });
  let result = `type ${name} = ${tsStr}`;
  if (options.export) {
    result = `export ${result}`;
  }
  return result;
};
