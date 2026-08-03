import type { Forwarder } from './type'

/**
 * Schemas with a const keyword are routed to the const parser first.
 * This works even when the schema also declares a type (e.g. `{ "type": "string", "const": "email" }`),
 * producing the correct literal type.
 */
export default <Forwarder>{
  is(schema): boolean {
    return schema && schema.const !== undefined && schema.const !== null
  },
  to: 'const',
}
