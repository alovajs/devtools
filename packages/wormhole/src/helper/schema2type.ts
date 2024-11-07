import { format } from '@/utils';
import { isArray } from 'lodash';
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { findBy$ref, getStandardRefName, isReferenceObject } from './openapi';
import { isValidJSIdentifier } from './standard';

export interface Schema2TypeOptions {
  deep?: boolean; // Whether to parse recursively

  shallowDeep?: boolean; // Only the outermost layer is analytic

  defaultType?: 'any' | 'unknown'; // Default type when not matched

  commentStyle?: 'line' | 'docment'; // Comment style

  preText?: string; // annotation prefix

  defaultRequire?: boolean; // If there is no nullbale or require, the default is require.

  searchMap: Map<string, string>;
  visited?: Set<string>;
  on$Ref?: (refOject: OpenAPIV3_1.ReferenceObject) => void;
}
/**
 * Generate comment string
 * @param type Comment style
 * @returns annotation object
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
      return startText + str.replace('*/*', '* / *').replace('/*', '/ *').replace('*/', '* /') + endText;
    }
  };
}
/**
 * Parse schema into ts type string
 * @param schemaOrigin schema object
 * @param openApi openApi object
 * @param config Configuration items
 * @returns ts type string
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
      // According to https://swagger.io/docs/specification/data-models/data-types/#string
      // For binary, change the type to Blob, all other format values can be treated as string

      if (schema.format === 'binary') {
        result = 'Blob';
      } else {
        result = 'string';
      }
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
      if (isArray(schema.type)) {
        result = schema.type
          .map(
            nextType => `(${parseSchema({ ...schema, type: nextType as (typeof schema)['type'] }, openApi, config)})`
          )
          .join(' | ');
      } else if (schema.oneOf) {
        result = schema.oneOf.map(item => `(${parseSchema(item, openApi, config)})`).join(' | ');
      } else if (schema.anyOf) {
        result = schema.anyOf.map(item => `(${parseSchema(item, openApi, config)})`).join(' | ');
      } else if (schema.allOf) {
        result = schema.allOf.map(item => `(${parseSchema(item, openApi, config)})`).join(' & ');
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
 *Parse object type schema into ts type string
 * @param schema schema object
 * @param openApi openApi object
 * @param config Configuration items
 * @returns  ts type string
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
    const optionalFlag =
      required.has(key) || (config.defaultRequire && !(schema as OpenAPIV3.SchemaObject).nullable) ? '' : '?';
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
 * Parse array type schema into ts type string
 * @param schema schema object
 * @param openApi openApi object
 * @param config Configuration items
 * @returns ts type string
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
 * Parse enum type schema into ts type string
 * @param schema schema object
 * @returns ts type string
 */
function parseEnum(schema: OpenAPIV3_1.SchemaObject): string {
  return schema.enum?.map?.((value: any) => JSON.stringify(value))?.join?.(' | ') || '';
}
/**
 * Parse the schema into a formatted ts type string
 * @param schemaOrigin schema object
 * @param openApi openapi document object
 * @param config Configuration items
 * @returns Formatted ts type string
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
  // Format ts type

  const tsStrFormat = await format(`type Ts = ${tsStr}`, {
    semi: false // remove semicolon
  });
  const resultFormat = /type Ts =(.*)/s.exec(tsStrFormat)?.[1] ?? '';
  const tsStrArr = resultFormat.trim().split('\n');
  // Add prefix to facilitate generating comments

  return tsStrArr.map((line, idx) => (idx ? config.preText : '') + line).join('\n');
}
interface JsonSchema2TsOptions {
  export?: boolean;
  defaultRequire?: boolean; // If there is no nullbale or require, the default is require.

  on$RefTsStr?: (name: string, tsStr: string) => void;
}
/**
 * Parse the schema object into a ts type string
 * @param schema schema object
 * @param name Type name
 * @param openApi openapi document object
 * @param options Configuration items
 * @returns interface Ts string
 */
export const jsonSchema2TsStr = async (
  schema: OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject,
  name: string,
  openApi: OpenAPIV3_1.Document,
  options: JsonSchema2TsOptions = {
    export: false,
    defaultRequire: false
  },
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
    defaultRequire: options.defaultRequire,
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
