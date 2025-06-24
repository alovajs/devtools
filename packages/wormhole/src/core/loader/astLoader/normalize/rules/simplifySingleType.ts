import type { SchemaObject } from '@/type';

export default function simplifySingleType(schema: SchemaObject): SchemaObject | void {
  if (Array.isArray(schema.type) && schema.type.length === 1) {
    return { ...schema, type: schema.type[0] } as SchemaObject;
  }
}
