import type { SchemaObject } from '@/type';

export default function validateSchema(schema: SchemaObject): SchemaObject | void {
  if (schema.type && typeof schema.type !== 'string' && !Array.isArray(schema.type)) {
    return { ...schema, type: 'null' };
  }
  if (schema.enum && (!Array.isArray(schema.enum) || schema.enum.length === 0)) {
    delete (schema as any).enum;
  }
  if (schema.const !== undefined && schema.const === null) {
    return { ...schema, type: 'null' };
  }
}
