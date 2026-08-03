import type { Forwarder } from './type'

export default <Forwarder>{
  is(schema): boolean {
    // check whether it is an object type
    // 1. type is 'object'
    // 2. or has a properties field
    // 3. or has an additionalProperties field
    return schema && (schema.type === 'object' || !!schema.properties || !!schema.additionalProperties)
  },
  to: 'object',
}
