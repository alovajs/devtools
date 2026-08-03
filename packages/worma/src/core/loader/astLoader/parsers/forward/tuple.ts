import type { Forwarder } from './type'
import type { MaybeSchemaObject, TupleSchemaObject } from '@/type'

export default <Forwarder>{
  is(schema): boolean {
    // check whether it is a tuple type
    // 1. type is 'array'
    // 2. items is an array (legacy JSON Schema tuple syntax) or prefixItems exists (OpenAPI 3.1 / JSON Schema 2020-12 tuple syntax)
    if (!schema)
      return false
    const tuple = schema as TupleSchemaObject
    const isItemsArray = Array.isArray(tuple.items) && (tuple.items as MaybeSchemaObject[]).length > 0
    const isPrefixItems = Array.isArray(tuple.prefixItems) && tuple.prefixItems.length > 0
    return schema.type === 'array' && (isItemsArray || isPrefixItems)
  },
  to: 'tuple',
}
