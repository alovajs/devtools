import type { SchemaObject, SchemaObjectV3 } from '@/type';

const NULL_TYPE = [null, 'null'];
export default function normalizeNullType(schema: SchemaObject): SchemaObject | void {
  // 兼容openai3.0的nullable
  if ((schema as SchemaObjectV3).nullable) {
    delete (schema as SchemaObjectV3).nullable;
    const currentType = schema.type || [];
    const typeArray = Array.isArray(currentType) ? currentType : [currentType];
    const filteredTypes = typeArray.filter(t => t !== null && t !== 'null');
    schema.type = filteredTypes.length > 0 ? [...filteredTypes, 'null'] : 'null';
  }
  if (schema.type === null || (Array.isArray(schema.type) && !schema.type.length)) {
    return { ...schema, type: 'null' };
  }
  if (Array.isArray(schema.type) && schema.type.some(t => NULL_TYPE.includes(t))) {
    const filteredTypes = schema.type.filter(t => !NULL_TYPE.includes(t));
    if (filteredTypes.length === 0) {
      return { ...schema, type: 'null' };
    }
    return { ...schema, type: [...filteredTypes, 'null'] };
  }
}
