import type { SchemaObject } from '@/type';

export default function mergeAnyOf(schema: SchemaObject): SchemaObject | void {
  if (!schema.anyOf || schema.anyOf.length < 2) {
    return;
  }
  const typeMap = new Map<string, SchemaObject[]>();
  for (const sub of schema.anyOf) {
    const t = (sub as SchemaObject).type;
    const typeKey = Array.isArray(t) ? t.join(',') : String(t);
    if (!typeMap.has(typeKey)) typeMap.set(typeKey, []);
    typeMap.get(typeKey)!.push(sub as SchemaObject);
  }
  const mergedAnyOf: SchemaObject[] = [];
  for (const group of typeMap.values()) {
    if (group.length === 1) {
      mergedAnyOf.push(group[0]);
    } else {
      const merged: Record<string, any> = { type: group[0].type };
      for (const sub of group) {
        for (const [key, value] of Object.entries(sub)) {
          if (key === 'type') continue;
          if (merged[key] === undefined) {
            merged[key] = value;
          } else if (Array.isArray(merged[key]) && Array.isArray(value)) {
            merged[key] = Array.from(new Set([...merged[key], ...value]));
          } else if (typeof merged[key] === 'object' && typeof value === 'object') {
            merged[key] = { ...merged[key], ...value };
          }
        }
      }
      mergedAnyOf.push(merged as SchemaObject);
    }
  }
  if (mergedAnyOf.length === schema.anyOf.length && mergedAnyOf.every((s, i) => s === schema.anyOf![i])) {
    return;
  }
  return { ...schema, anyOf: mergedAnyOf } as SchemaObject;
}
