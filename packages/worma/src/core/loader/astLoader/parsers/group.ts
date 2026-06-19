import type { ASTParser, ParserCtx } from './type'
import type { AbstractAST, SchemaObject, TIntersection, TUnion } from '@/type'
import { CommentHelper, logger } from '@/helper'
import { ASTType } from '@/type'
import { initAST } from './utils'

export function groupTypeParser(schema: SchemaObject, ctx: ParserCtx) {
  const result: AbstractAST = {
    ...initAST(schema, ctx),
  }
  const items = schema.anyOf || schema.oneOf || schema.allOf || []
  const params = items.map(value => ctx.next(value, ctx.options))
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
  if (schema.anyOf || schema.oneOf) {
    return {
      ...result,
      type: ASTType.UNION,
      params,
    } as TUnion
  }
  if (schema.allOf) {
    // 显式检查 allOf
    return {
      ...result,
      type: ASTType.INTERSECTION,
      params,
    } as TIntersection
  }
  throw logger.throwError('schema must contain anyOf, oneOf or allOf', {
    schema,
  })
}

export default <ASTParser>{
  type: 'group',
  parse: groupTypeParser,
}
