import { format } from '@/utils';
// Remove comments

export function removeComments(content: string) {
  // Remove single line comments

  content = content.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments and documentation comments

  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  return content;
}
const LEFT_BRACKET = ['(', '<', '{', '['];
const RIGHT_BRACKET = [')', '>', '}', ']'];
function parseTypeBody(typeBody: string) {
  const processedTypeBody = typeBody
    .replace(/:\s*\n\s*\|/g, ':') // Handle union type after colon
    .replace(/:\s*\n\s*&/g, ':') // Handle intersection type after colon
    .replace(/\n\s*\|/g, '|') // Handle union type line breaks
    .replace(/\n\s*&/g, '&'); // Handle intersection type line breaks
  const properties = [];
  let bracketCount = 0;
  let currentProperty = '';

  for (let i = 0; i < processedTypeBody.length; i += 1) {
    const char = processedTypeBody[i];
    if (LEFT_BRACKET.includes(char)) {
      bracketCount += 1;
    } else if (RIGHT_BRACKET.includes(char)) {
      bracketCount -= 1;
    }
    currentProperty += char;
    if (currentProperty.trim() && /\n/.test(char) && bracketCount === 0) {
      properties.push(currentProperty.trim());
      currentProperty = '';
    }
  }
  if (currentProperty.trim()) {
    properties.push(currentProperty.trim());
  }
  const parsedProperties = properties
    .map(prop => {
      const [keyOrigin, ...valueOrigin] = prop.split(':');
      const key = keyOrigin.trim();
      const value = valueOrigin.join(':').trim();
      const isOptional = key.endsWith('?');
      const defaultValue = getDefaultValue(value);
      return { key: key.replace('?', ''), value: defaultValue, isOptional };
    })
    .filter(prop => !prop.isOptional)
    .map(prop => `${prop.key}: ${prop.value}`)
    .join(',\n');
  return `{\n${parsedProperties}\n}`;
}
function isSplitType(type: string, c: '&' | '|') {
  if (!type.includes(c)) {
    return false;
  }
  let bracketCount = 0;
  for (let i = 0; i < type.length; i += 1) {
    const char = type[i];
    if (LEFT_BRACKET.includes(char)) {
      bracketCount += 1;
    } else if (RIGHT_BRACKET.includes(char)) {
      bracketCount -= 1;
    }
    if (bracketCount === 0 && char === c) {
      return true;
    }
  }
  return false;
}
function splitTypes(typeStr: string, c: '&' | '|'): string[] {
  const result: string[] = [];
  let bracketCount = 0;
  let currentType = '';
  for (let i = 0; i < typeStr.length; i += 1) {
    const char = typeStr[i];
    if (LEFT_BRACKET.includes(char)) {
      bracketCount += 1;
    } else if (RIGHT_BRACKET.includes(char)) {
      bracketCount -= 1;
    }

    if (char === c && bracketCount === 0) {
      result.push(currentType.trim());
      currentType = '';
    } else {
      currentType += char;
    }
  }
  if (currentType.trim()) {
    result.push(currentType.trim());
  }
  return result;
}
function isIntersectionType(type: string) {
  return isSplitType(type, '&');
}
function isUnionType(type: string) {
  return isSplitType(type, '|');
}
function getDefaultValue(type: string): string {
  // Remove trailing semicolon
  type = type.replace(/;$/, '');
  if (isUnionType(type)) {
    const types = splitTypes(type, '|');
    return getDefaultValue(types[0]);
  }
  if (isIntersectionType(type)) {
    const types = splitTypes(type, '&');
    const mergedDefaults = types.map(t => getDefaultValue(t));
    return mergedDefaults.reduce((acc, curr) => {
      if (curr.startsWith('{') && curr.endsWith('}')) {
        const currProperties = curr.slice(1, -1).trim();
        if (acc === '{ }') {
          return `{\n ${currProperties} \n}`;
        }
        return `${acc.slice(0, -2)},\n ${currProperties} \n}`;
      }
      return acc;
    }, '{ }');
  }
  if (type.startsWith('(') && type.endsWith(')')) {
    return getDefaultValue(type.slice(1, -1).trim());
  }
  if (type.startsWith('{') && type.endsWith('}')) {
    return parseTypeBody(type.slice(1, -1).trim());
  }
  if (type.endsWith(')[]') && type.startsWith('(')) {
    return '[]';
  }
  if (type.endsWith('[]') || type.startsWith('Array<')) {
    return '[]';
  }

  if (type.startsWith('[') && type.endsWith(']')) {
    return parseTuple(type);
  }
  if ((type.startsWith("'") && type.endsWith("'")) || (type.startsWith('"') && type.endsWith('"'))) {
    return type;
  }
  if (parseInt(type, 10)) {
    return type;
  }
  switch (type) {
    case 'string':
      return '""';
    case 'number':
      return '0';
    case 'boolean':
      return 'false';
    case 'null':
    case 'undefined':
      return type;
    default:
      return '{ }';
  }
}
function parseTuple(tupleType: string) {
  const elements = tupleType
    .slice(1, -1)
    .split(',')
    .map(el => el.trim());
  const parsedElements = elements.map(el => getDefaultValue(el));
  return `[${parsedElements.join(', ')}]`;
}
/**
 * Generates default value objects for types and interfaces from the given TypeScript source code.
 * @param sourceCode -TypeScript source code string
 * @returns Object containing type and interface default values
 */
export function generateDefaultValuesFormat(sourceCode: string) {
  return format(generateDefaultValues(sourceCode), {
    parser: 'json'
  });
}

export const generateDefaultValues = (sourceCode: string) => getDefaultValue(removeComments(sourceCode).trim());
