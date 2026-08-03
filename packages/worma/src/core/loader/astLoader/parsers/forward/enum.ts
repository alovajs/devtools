import type { Forwarder } from './type'

export default <Forwarder>{
  is(schema): boolean {
    // check whether it is an enum type
    // has an enum field that is a non-empty array
    return schema && !!schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0
  },
  to: 'enum',
}
