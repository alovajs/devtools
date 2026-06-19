import type { ASTParser, ParserCtx } from './type'
import type { SchemaObject, TTuple, TupleSchemaObject } from '@/type'
import { CommentHelper } from '@/helper'
import { ASTType } from '@/type'
import { initAST } from './utils'

export function tupleTypeParser(schema: TupleSchemaObject, ctx: ParserCtx) {
  const params = schema.items.map(item => ctx.next(item, ctx.options))
  const result: TTuple = {
    ...initAST(schema as SchemaObject, ctx),
    type: ASTType.TUPLE,
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    params,
  }
  const deepCommenter = CommentHelper.load({
    type: ctx.options.commentType,
  })
  params.forEach((itemsAst, idx) => {
    const comment = CommentHelper.parseStr(itemsAst.comment ?? '')
    const deepComment = CommentHelper.parseStr(itemsAst.deepComment ?? '')
    if (comment || deepComment) {
      deepCommenter
        .add(`[params${idx + 1}] start`)
        .add(comment)
        .add(deepComment)
        .add(`[params${idx + 1}] end`)
    }
  })
  result.deepComment = deepCommenter.end()
  return result
}

export default <ASTParser>{
  type: 'tuple',
  parse: tupleTypeParser,
}
