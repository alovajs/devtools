import type { MaybeSchemaObject, SchemaObject } from '@/type'
import { cloneDeep, isEqual } from 'lodash'
import { isMaybeArraySchemaObject, isReferenceObject } from '@/utils'
/**
 * Rule handler function type
 */
export type RuleHandler = (schema: SchemaObject) => SchemaObject | void
/**
 * Rule definition
 */
export interface NormalizationRule {
  name: string
  description: string
  handler: RuleHandler
}

export class SchemaNormalizer {
  private rules: NormalizationRule[] = []

  /**
   * Add a new rule
   */
  addRule(rule: NormalizationRule) {
    this.rules.push(rule)
    return this
  }

  /**
   * Normalize JSON Schema
   * M1-A3: replaced JSON.stringify-based cycle detection with WeakSet, eliminating the O(s) serialization cost per node
   */
  normalize(schema: MaybeSchemaObject): MaybeSchemaObject {
    // depth-first traversal
    const visited = new WeakSet<object>()

    const process = (s: MaybeSchemaObject): MaybeSchemaObject => {
      if (!s || isReferenceObject(s) || visited.has(s as object)) {
        return s
      }
      visited.add(s as object)

      // process combinatory keywords
      if (s.anyOf) {
        s.anyOf = s.anyOf.map(item => process(item))
      }
      if (s.oneOf) {
        s.oneOf = s.oneOf.map(item => process(item))
      }
      if (s.allOf) {
        s.allOf = s.allOf.map(item => process(item))
      }

      // process array type
      if (isMaybeArraySchemaObject(s)) {
        s.items = process(s.items)
      }

      // process object properties
      if (s.properties) {
        const newProps: Record<string, SchemaObject> = {}
        for (const [key, value] of Object.entries(s.properties)) {
          newProps[key] = process(value)
        }
        s.properties = newProps
      }
      let result = s
      // apply rules
      for (const rule of this.rules) {
        const newResult = rule.handler(result)
        if (newResult && !visited.has(newResult as object)) {
          result = newResult
          visited.add(result as object)
        }
      }
      if (isEqual(s, result)) {
        return result
      }
      visited.delete(result as object)
      return process(result)
    }
    return process(cloneDeep(schema))
  }
}
