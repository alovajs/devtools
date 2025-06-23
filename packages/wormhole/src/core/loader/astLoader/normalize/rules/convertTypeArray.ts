import type { SchemaObject, SchemaType } from '@/type';

const GLOBAL_KEYWORDS = ['title', 'description', 'default', 'examples', 'deprecated', 'readOnly', 'writeOnly', 'const'];
const TYPE_SPECIFIC_KEYWORDS = {
  string: ['minLength', 'maxLength', 'pattern', 'format', 'contentMediaType'],
  number: ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'],
  integer: ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'],
  array: ['items', 'minItems', 'maxItems', 'uniqueItems'],
  object: ['properties', 'additionalProperties', 'required', 'minProperties', 'maxProperties']
};

export function assignTypeSpecificKeywords(
  branch: SchemaObject,
  type: string,
  typeSpecificKeywords: Record<string, any>
) {
  const keywords = TYPE_SPECIFIC_KEYWORDS[type as keyof typeof TYPE_SPECIFIC_KEYWORDS];
  if (!keywords) {
    Object.assign(branch, typeSpecificKeywords);
    return;
  }
  keywords.forEach(key => {
    if (key in typeSpecificKeywords) {
      (branch as any)[key] = typeSpecificKeywords[key];
    }
  });
}

export default function convertTypeArray(schema: SchemaObject): SchemaObject | void {
  if (!Array.isArray(schema.type) || schema.type.length <= 1 || (schema.enum && Array.isArray(schema.enum))) {
    return;
  }
  const { type: typeArray, ...restSchema } = schema;
  const globalKeywords: Record<string, any> = {};
  const typeSpecificKeywords: Record<string, any> = {};
  for (const [key, value] of Object.entries(restSchema)) {
    if (GLOBAL_KEYWORDS.includes(key)) {
      globalKeywords[key] = value;
    } else {
      typeSpecificKeywords[key] = value;
    }
  }
  const branches = typeArray.map(t => {
    const branch = { type: t as SchemaType } as SchemaObject;
    assignTypeSpecificKeywords(branch, t, typeSpecificKeywords);
    return branch;
  });
  return { ...globalKeywords, anyOf: branches } as SchemaObject;
}
