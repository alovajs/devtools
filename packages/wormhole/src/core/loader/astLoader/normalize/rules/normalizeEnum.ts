import type { SchemaObject } from '@/type';
import { getType } from '@/utils';
import { omit, pick } from 'lodash';
import { GLOBAL_KEYWORDS } from './convertTypeArray';

export default function normalizeEnum(schema: SchemaObject): SchemaObject | void {
  if (!schema.enum || !Array.isArray(schema.enum) || !schema.enum.length) {
    return;
  }
  const enumArray = schema.enum ?? [];
  const typeArray = [...new Set([schema.type ?? []].flat())] as string[];
  const enumTypeArray: string[] = [];
  enumArray.forEach(item => {
    const type = getType(item);
    if (!enumTypeArray.includes(type)) {
      enumTypeArray.push(type);
    }
  });
  const otherType = typeArray.filter(item => !enumTypeArray.includes(item));
  const enumType = enumTypeArray.length > 1 ? enumTypeArray : (enumTypeArray[0] ?? 'null');
  if (otherType.length > 0) {
    return {
      ...pick(schema, GLOBAL_KEYWORDS),
      anyOf: [
        {
          type: enumType,
          enum: enumArray
        },
        {
          type: otherType,
          ...omit(schema, GLOBAL_KEYWORDS.concat(['type', 'enum']))
        }
      ]
    } as SchemaObject;
  }
  return { ...schema, type: enumType } as SchemaObject;
}
