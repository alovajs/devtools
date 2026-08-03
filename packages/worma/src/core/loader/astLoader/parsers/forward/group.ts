import type { Forwarder } from './type'

export default <Forwarder>{
  is(schema): boolean {
    // check whether it is a combinatory type
    // 1. has oneOf field (union type)
    // 2. or has anyOf field (union type)
    // 3. or has allOf field (intersection type)
    return schema && (!!schema.oneOf || !!schema.anyOf || !!schema.allOf)
  },
  to: 'group',
}
