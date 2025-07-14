import type { Forwarder } from './type'
import { isMaybeArraySchemaObject } from '@/utils'

export default <Forwarder>{
  is(schema): boolean {
    // 判断是否为数组类型
    // 1. type 为 'array'
    // 2. 或者有 items 字段
    return schema.type === 'array' || isMaybeArraySchemaObject(schema)
  },
  to: 'array',
}
