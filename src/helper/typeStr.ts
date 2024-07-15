// 去除注释
function removeComments(content: string) {
  // 去除单行注释
  content = content.replace(/\/\/.*$/gm, '');
  // 去除多行注释和文档注释
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  return content;
}

function parseTypeBody(typeBody: string) {
  const properties = [];
  let bracketCount = 0;
  let currentProperty = '';

  for (let i = 0; i < typeBody.length; i += 1) {
    const char = typeBody[i];
    if (['<', '{', '['].includes(char)) {
      bracketCount += 1;
    } else if (['>', '}', ']'].includes(char)) {
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
    .map(prop => `${prop.key}:${prop.value}`)
    .join(',\n');
  return `{\n${parsedProperties}\n}`;
}
function isIntersectionType(type: string) {
  if (!type.includes('&')) {
    return false;
  }
  let bracketCount = 0;
  for (let i = 0; i < type.length; i += 1) {
    const char = type[i];
    if (['<', '{', '['].includes(char)) {
      bracketCount += 1;
    } else if (['>', '}', ']'].includes(char)) {
      bracketCount -= 1;
    }
    if (bracketCount === 0 && char === '&') {
      return true;
    }
  }
  return false;
}
function isUnionType(type: string) {
  if (!type.includes('|')) {
    return false;
  }
  let bracketCount = 0;
  for (let i = 0; i < type.length; i += 1) {
    const char = type[i];
    if (['<', '{', '['].includes(char)) {
      bracketCount += 1;
    } else if (['>', '}', ']'].includes(char)) {
      bracketCount -= 1;
    }
    if (bracketCount === 0 && char === '|') {
      return true;
    }
  }
  return false;
}
function getDefaultValue(type: string): string {
  if (isUnionType(type)) {
    const types = type.split('|').map(t => t.trim());
    return getDefaultValue(types[0]);
  }
  if (isIntersectionType(type)) {
    const types = type.split('&').map(t => t.trim());
    const mergedDefaults = types.map(t => getDefaultValue(t));
    return mergedDefaults.reduce((acc, curr) => {
      if (curr.startsWith('{') && curr.endsWith('}')) {
        const currProperties = curr.slice(1, -1).trim();
        if (acc === '{}') {
          return `{ ${currProperties} }`;
        }
        return `${acc.slice(0, -1)}, ${currProperties} }`;
      }
      return acc;
    }, '{}');
  }
  if (type.startsWith('{') && type.endsWith('}')) {
    return parseTypeBody(type.slice(1, -1));
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
      return '{}';
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
 * 从给定的 TypeScript 源代码生成类型和接口的默认值对象。
 * @param sourceCode - TypeScript 源代码字符串
 * @returns 包含类型和接口默认值的对象
 */
export function generateDefaultValues(sourceCode: string): string {
  return getDefaultValue(removeComments(sourceCode).trim());
}
export default {
  generateDefaultValues
};
