import type { SchemaObject } from '@/type'

export default function handleEmptyType(schema: SchemaObject): SchemaObject | void {
  if (!schema.type && !schema.enum && !schema.oneOf && !schema.anyOf && !schema.allOf && schema.const === undefined) {
    return { ...schema, type: 'null' }
  }
}
