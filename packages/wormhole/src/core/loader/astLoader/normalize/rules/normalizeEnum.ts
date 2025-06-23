import type { SchemaObject } from '@/type';
import { getType } from '../../parsers/utils';

export default function normalizeEnum(schema: SchemaObject): SchemaObject | void {
  if (!schema.enum || !Array.isArray(schema.enum) || !schema.enum.length) {
    return;
  }
  const enumArray = schema.enum ?? [];
  const typeArray = [...new Set([schema.type ?? []].flat())] as string[];
  enumArray.forEach(item => {
    const type = getType(item);
    if (!typeArray.includes(type)) {
      typeArray.push(type);
    }
  });
  const type = typeArray.length > 1 ? typeArray : (typeArray[0] ?? 'null');
  return { ...schema, type } as SchemaObject;
}
