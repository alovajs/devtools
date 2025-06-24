import type { MaybeSchemaObject, SchemaObject } from '@/type';

export default function normalizeCombiningKeywords(schema: SchemaObject): SchemaObject | void {
  const { allOf, anyOf, oneOf, ...baseSchema } = schema;
  // 如果没有组合关键字，或只存在其中一个，则无需处理
  if ([allOf, anyOf, oneOf].filter(Boolean).length <= 1) {
    return;
  }
  // 用于存储最终转换后的 allOf 数组
  const allOfArray: MaybeSchemaObject[] = [];

  // 2. 处理原始 allOf（展开到新 allOf 中）
  if (Array.isArray(allOf)) {
    allOfArray.push(...allOf);
  }

  // 3. 处理 anyOf（包装成 anyOf 对象）
  if (Array.isArray(anyOf) && anyOf.length > 0) {
    allOfArray.push({ anyOf });
  }

  // 4. 处理 oneOf（包装成 oneOf 对象）
  if (Array.isArray(oneOf) && oneOf.length > 0) {
    allOfArray.push({ oneOf });
  }

  // 构建最终模式
  return allOfArray.length > 0 ? { allOf: allOfArray, ...baseSchema } : baseSchema;
}
