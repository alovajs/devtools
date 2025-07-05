import type { MaybeSchemaObject, SchemaObject } from '@/type';
import { isMaybeArraySchemaObject, isReferenceObject } from '@/utils';
import { cloneDeep, isEqual } from 'lodash';
/**
 * 规则处理函数类型
 */
export type RuleHandler = (schema: SchemaObject) => SchemaObject | void;
/**
 * 规则定义
 */
export interface NormalizationRule {
  name: string;
  description: string;
  handler: RuleHandler;
}

export class SchemaNormalizer {
  private rules: NormalizationRule[] = [];

  /**
   * 添加新规则
   */
  addRule(rule: NormalizationRule) {
    this.rules.push(rule);
    return this;
  }

  /**
   * 规范化 JSON Schema
   */
  normalize(schema: MaybeSchemaObject): MaybeSchemaObject {
    // 深度优先遍历
    const process = (s: MaybeSchemaObject, visited = new Set<string>()): MaybeSchemaObject => {
      if (!s || isReferenceObject(s) || visited.has(JSON.stringify(s))) {
        return s;
      }
      // 处理组合模式
      if (s.anyOf) {
        s.anyOf = s.anyOf.map(item => process(item));
      }
      if (s.oneOf) {
        s.oneOf = s.oneOf.map(item => process(item));
      }
      if (s.allOf) {
        s.allOf = s.allOf.map(item => process(item));
      }

      // 处理数组类型
      if (isMaybeArraySchemaObject(s)) {
        s.items = process(s.items);
      }

      // 处理对象属性
      if (s.properties) {
        const newProps: Record<string, SchemaObject> = {};
        for (const [key, value] of Object.entries(s.properties)) {
          newProps[key] = process(value);
        }
        s.properties = newProps;
      }
      let result = s;
      // 应用规则
      for (const rule of this.rules) {
        const newResult = rule.handler(result);
        if (newResult && !visited.has(JSON.stringify(newResult))) {
          result = newResult;
          visited.add(JSON.stringify(result));
        }
      }
      if (isEqual(s, result)) {
        return result;
      }
      visited.delete(JSON.stringify(result));
      return process(result, visited);
    };
    return process(cloneDeep(schema));
  }
}
