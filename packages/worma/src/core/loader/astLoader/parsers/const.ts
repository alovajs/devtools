import type { ASTParser, ParserCtx } from './type'
import type { AST, SchemaObject, TLiteral } from '@/type'
import { ASTType } from '@/type'
import { initAST } from './utils'

/**
 * 将带有 const 关键字的 JSON Schema 解析为字面量 AST 节点。
 * 例如：
 *   { "type": "string", "const": "email" }   -> "email"
 *   { "type": "number", "const": 1 }          -> 1
 *   { "const": true }                         -> true
 *   { "const": "authorization_code" }         -> "authorization_code"
 *
 * 参考：JSON Schema draft-04+ 允许 `const` 与 `type` 同时出现，
 * 表示该字段必须等于 `const` 的值，对应到 TypeScript 即字面量类型。
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
