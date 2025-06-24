import type { SchemaObject } from '@/type';

const TYPE_SPECIFIC_KEYWORDS = {
  string: ['minLength', 'maxLength', 'pattern', 'format', 'contentMediaType'],
  number: ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'],
  integer: ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'],
  array: ['items', 'minItems', 'maxItems', 'uniqueItems'],
  object: ['properties', 'additionalProperties', 'required', 'minProperties', 'maxProperties']
};

export default function removeRedundantKeywords(schema: SchemaObject): SchemaObject | void {
  if (!schema.type || Array.isArray(schema.type)) return;
  const { type } = schema;
  const cleanSchema = { ...schema };
  const typeKeywords = TYPE_SPECIFIC_KEYWORDS[type as keyof typeof TYPE_SPECIFIC_KEYWORDS] ?? [];
  Object.entries(TYPE_SPECIFIC_KEYWORDS).forEach(([typeName, keywords]) => {
    if (type === typeName) return;
    keywords.forEach(keyword => {
      if (keyword in cleanSchema && !typeKeywords.includes(keyword)) {
        delete (cleanSchema as any)[keyword];
      }
    });
  });
  return cleanSchema;
}
