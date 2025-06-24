import type { SchemaObject, SchemaType } from '@/type';
import { isMaybeArraySchemaObject } from '@/utils';

export default function inferType(schema: SchemaObject): SchemaObject | void {
  if (
    Array.isArray(schema.type) ||
    (typeof schema.type === 'string' &&
      ['string', 'number', 'integer', 'boolean', 'null', 'array', 'object'].includes(schema.type))
  ) {
    return;
  }
  if (schema.enum || schema.oneOf || schema.anyOf || schema.allOf) {
    return;
  }
  const type: SchemaType[] = [];
  if (
    schema.properties ||
    schema.additionalProperties ||
    schema.required ||
    schema.minProperties !== undefined ||
    schema.maxProperties !== undefined
  ) {
    type.push('object');
  }
  if (
    isMaybeArraySchemaObject(schema) ||
    schema.minItems !== undefined ||
    schema.maxItems !== undefined ||
    schema.uniqueItems !== undefined ||
    (schema as any).contains
  ) {
    type.push('array');
  }
  if (
    schema.minLength !== undefined ||
    schema.maxLength !== undefined ||
    schema.pattern ||
    schema.format ||
    schema.contentMediaType
  ) {
    type.push('string');
  }
  if (
    schema.minimum !== undefined ||
    schema.maximum !== undefined ||
    schema.multipleOf !== undefined ||
    schema.exclusiveMinimum !== undefined ||
    schema.exclusiveMaximum !== undefined
  ) {
    type.push('number');
  }
  return { ...schema, type };
}
