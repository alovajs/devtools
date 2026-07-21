import type { Forwarder } from './type'
import type { MaybeSchemaObject, TupleSchemaObject } from '@/type'

export default <Forwarder>{
  is(schema): boolean {
    // 判断是否为元组类型
    // 1. type 为 'array'
    // 2. 且 items 是数组（老版 JSON Schema 元组语法）或存在 prefixItems（OpenAPI 3.1 / JSON Schema 2020-12 元组语法）
    if (!schema)
      return false
    const tuple = schema as TupleSchemaObject
    const isItemsArray = Array.isArray(tuple.items) && (tuple.items as MaybeSchemaObject[]).length > 0
    const isPrefixItems = Array.isArray(tuple.prefixItems) && tuple.prefixItems.length > 0
    return schema.type === 'array' && (isItemsArray || isPrefixItems)
  },
  to: 'tuple',
}
