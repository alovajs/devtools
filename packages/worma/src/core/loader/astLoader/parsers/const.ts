import type { ASTParser, ParserCtx } from './type'
import type { AST, SchemaObject, TLiteral } from '@/type'
import { ASTType } from '@/type'
import { initAST } from './utils'

/**
 * Parse a JSON Schema with a const keyword into a literal AST node.
 * For example:
 *   { "type": "string", "const": "email" }   -> "email"
 *   { "type": "number", "const": 1 }          -> 1
 *   { "const": true }                         -> true
 *   { "const": "authorization_code" }         -> "authorization_code"
 *
 * Reference: JSON Schema draft-04+ allows `const` and `type` to appear together,
 * meaning the field must equal the `const` value, which maps to a TypeScript literal type.
 */
export function constTypeParser(schema: SchemaObject, ctx: ParserCtx): AST {
  const result: TLiteral = {
    ...initAST(schema, ctx),
    type: ASTType.LITERAL,
    params: schema.const,
  }
  return result
}

export default <ASTParser>{
  type: 'const',
  parse: constTypeParser,
}
