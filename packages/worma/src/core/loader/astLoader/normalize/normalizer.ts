import type { MaybeSchemaObject, SchemaObject } from '@/type'
import { cloneDeep, isEqual } from 'lodash'
import { isMaybeArraySchemaObject, isReferenceObject } from '@/utils'
/**
 * 规则处理函数类型
 */
export type RuleHandler = (schema: SchemaObject) => SchemaObject | void
/**
 * 规则定义
 */
export interface NormalizationRule {
  name: string
  description: string
  handler: RuleHandler
}

export class SchemaNormalizer {
  private rules: NormalizationRule[] = []

  /**
   * 添加新规则
   */
  addRule(rule: NormalizationRule) {
    this.rules.push(rule)
    return this
  }

  /**
   * 规范化 JSON Schema
   * M1-A3: 循环检测从 JSON.stringify 改为 WeakSet，消除每节点 O(s) 序列化开销
   */
  normalize(schema: MaybeSchemaObject): MaybeSchemaObject {
    // 深度优先遍历
    const visited = new WeakSet<object>()

    const process = (s: MaybeSchemaObject): MaybeSchemaObject => {
      if (!s || isReferenceObject(s) || visited.has(s as object)) {
        return s
      }
      visited.add(s as object)

      // 处理组合模式
      if (s.anyOf) {
        s.anyOf = s.anyOf.map(item => process(item))
      }
      if (s.oneOf) {
        s.oneOf = s.oneOf.map(item => process(item))
      }
      if (s.allOf) {
        s.allOf = s.allOf.map(item => process(item))
      }

      // 处理数组类型
      if (isMaybeArraySchemaObject(s)) {
        s.items = process(s.items)
      }

      // 处理对象属性
      if (s.properties) {
        const newProps: Record<string, SchemaObject> = {}
        for (const [key, value] of Object.entries(s.properties)) {
          newProps[key] = process(value)
        }
        s.properties = newProps
      }
      let result = s
      // 应用规则
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
