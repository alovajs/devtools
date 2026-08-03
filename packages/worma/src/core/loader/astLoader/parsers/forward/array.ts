import type { Forwarder } from './type'
import { isMaybeArraySchemaObject } from '@/utils'

export default <Forwarder>{
  is(schema): boolean {
    // check whether it is an array type
    // 1. type is 'array'
    // 2. or has an items field
    return schema && (schema.type === 'array' || isMaybeArraySchemaObject(schema))
  },
  to: 'array',
}
