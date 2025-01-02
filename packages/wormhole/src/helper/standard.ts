import { strHashCode } from '@/utils';
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
export const makeIdentifier = (str: string, style: 'camelCas' | 'snakeCase') => {
  // Removes all characters that are not letters, numbers, underscores, and dollar signs while splitting words
  const words = str.split(/[^a-zA-Z0-9_$]+/).filter(Boolean);

  // Convert words to camelCase form
  let identifier = '';
  switch (style) {
    case 'camelCas':
      identifier = words
        .map((word, index) => {
          if (index === 0) {
            return word.toLowerCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
      break;
    case 'snakeCase':
      identifier = words.join('_').toLowerCase();
      break;
    default:
      identifier = words.join('');
      break;
  }

  // If the string starts with a number, replace it with an underscore
  if (/^[0-9]/.test(identifier)) {
    identifier = `_${identifier}`;
  }

  // If it is a reserved word, add a suffix
  if (reservedWords.has(identifier)) {
    identifier += '_';
  }
  return identifier;
};
export const isValidJSIdentifier = (str?: string) =>
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
    operationId = makeIdentifier(pathObject.operationId as string, 'camelCas');
  }
  if (!operationId) {
    operationId = makeIdentifier(`${method}/${url}`, 'snakeCase');
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
    tag = tag.trim();
    if (isValidJSIdentifier(tag)) {
      tagsSet.add(tag);
      return tag;
    }
    let newTag = '';
    if (tag) {
      newTag = makeIdentifier(tag, 'camelCas');
    }
    if (tagsSet.has(newTag)) {
      let num = 1;
      while (tagsSet.has(`${newTag}${num}`)) {
        num += 1;
      }
      newTag = `${newTag}${num}`;
    }
    if (!newTag) {
      newTag = 'general';
    }
    tagsSet.add(newTag);
    return newTag;
  });
}
export function getRandomVariable(value: string) {
  return `${strHashCode(value)}`
    .split('')
    .map(code => {
      let numberCode = Number(code);
      numberCode = Number.isNaN(numberCode) ? 10 : numberCode;
      return String.fromCharCode(numberCode + 97);
    })
    .join('');
}
export default {
  getStandardOperationId,
  getStandardTags,
  makeIdentifier,
  getRandomVariable
};
