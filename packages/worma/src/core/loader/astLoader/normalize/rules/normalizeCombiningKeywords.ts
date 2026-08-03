import type { MaybeSchemaObject, SchemaObject } from '@/type'

export default function normalizeCombiningKeywords(schema: SchemaObject): SchemaObject | void {
  const { allOf, anyOf, oneOf, ...baseSchema } = schema
  // if there are no combinatory keywords, or only one of them exists, no processing is needed
  if ([allOf, anyOf, oneOf].filter(Boolean).length <= 1) {
    return
  }
  // store the final converted allOf array
  const allOfArray: MaybeSchemaObject[] = []

  // 2. process the original allOf (spread into the new allOf)
  if (Array.isArray(allOf)) {
    allOfArray.push(...allOf)
  }

  // 3. process anyOf (wrap into an anyOf object)
  if (Array.isArray(anyOf) && anyOf.length > 0) {
    allOfArray.push({ anyOf })
  }

  // 4. process oneOf (wrap into a oneOf object)
  if (Array.isArray(oneOf) && oneOf.length > 0) {
    allOfArray.push({ oneOf })
  }

  // build the final schema
  return allOfArray.length > 0 ? { allOf: allOfArray, ...baseSchema } : baseSchema
}
