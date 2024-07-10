import { OpenAPIV3_1 } from 'openapi-types';

const reservedWords = new Set([
  'abstract',
  'arguments',
  'await',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'function',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'let',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'volatile',
  'while',
  'with',
  'yield'
]);
const makeCamelCaseIdentifier = (str: string) => {
  // 移除所有非字母、数字、下划线和美元符号的字符，同时拆分单词
  const words = str.split(/[^a-zA-Z0-9_$]+/).filter(Boolean);

  // 将单词转换为小驼峰形式
  let camelCaseStr = words
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');

  // 如果字符串以数字开头，用下划线替换
  if (/^[0-9]/.test(camelCaseStr)) {
    camelCaseStr = `_${camelCaseStr}`;
  }

  // 如果是保留字，添加一个后缀
  if (reservedWords.has(camelCaseStr)) {
    camelCaseStr += '_';
  }

  return camelCaseStr;
};
const isValidJSIdentifier = (str?: string) =>
  !!str && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str) && !reservedWords.has(str);
export function getStandardOperationId(
  pathObject: OpenAPIV3_1.OperationObject,
  url: string,
  method: string,
  map: Set<string>
): string {
  if (isValidJSIdentifier(pathObject.operationId)) {
    return pathObject.operationId as string;
  }
  let operationId = '';
  if (pathObject.operationId) {
    operationId = makeCamelCaseIdentifier(pathObject.operationId as string);
  }
  if (!operationId) {
    operationId = makeCamelCaseIdentifier(`${method}/${url}`);
  }
  if (map.has(operationId)) {
    let num = 1;
    while (map.has(`${operationId}${num}`)) {
      num += 1;
    }
    operationId = `${operationId}${num}`;
  }
  map.add(operationId);
  return operationId;
}
export function getStandardTags(tags?: string[]) {
  const tagsSet = new Set<string>();
  if (!tags) {
    return ['general'];
  }
  return tags.map(tag => {
    if (isValidJSIdentifier(tag)) {
      tagsSet.add(tag);
      return tag;
    }
    let newTag = '';
    if (tag) {
      newTag = makeCamelCaseIdentifier(tag);
    }
    if (!newTag) {
      newTag = 'general';
    }
    if (tagsSet.has(newTag)) {
      let num = 1;
      while (tagsSet.has(`${newTag}${num}`)) {
        num += 1;
      }
      newTag = `${newTag}${num}`;
    }
    tagsSet.add(newTag);
    return newTag;
  });
}
export default {
  getStandardOperationId
};
