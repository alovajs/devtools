import type { SchemaObject } from '@/type';

export default function normalizeNullType(schema: SchemaObject): SchemaObject | void {
  if (schema.type === null || (Array.isArray(schema.type) && !schema.type.length)) {
    return { ...schema, type: 'null' };
  }
  if (Array.isArray(schema.type) && schema.type.includes(null as any)) {
    const filteredTypes = schema.type.filter(t => t !== null);
    if (filteredTypes.length === 0) {
      return { ...schema, type: 'null' };
    }
    return { ...schema, type: [...filteredTypes, 'null'] };
  }
}
