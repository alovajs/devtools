import type { ASTParser, ParserCtx } from './type'
import type { AST, MaybeSchemaObject, SchemaObject, TTuple, TupleSchemaObject } from '@/type'
import { CommentHelper } from '@/helper'
import { ASTType } from '@/type'
import { initAST } from './utils'

export function tupleTypeParser(schema: TupleSchemaObject, ctx: ParserCtx) {
  // OpenAPI 3.1 / JSON Schema 2020-12 用 prefixItems 表示固定位置元素，兼容老版 items 数组写法
  const elementSchemas = (Array.isArray(schema.prefixItems)
    ? schema.prefixItems
    : (Array.isArray(schema.items) ? schema.items : [])) as MaybeSchemaObject[]
  const params = elementSchemas.map(item => ctx.next(item, ctx.options))

  // 2020-12：单数 items 表示"剩余项"类型；items:false / additionalItems:false 表示禁止额外项
  let spreadParam: AST | undefined
  if (schema.items && !Array.isArray(schema.items)) {
    spreadParam = ctx.next(schema.items, ctx.options)
  }
  else if ((schema as { additionalItems?: unknown, items?: unknown }).additionalItems === false || (schema as { items?: unknown }).items === false) {
    spreadParam = { type: ASTType.NEVER }
  }

  const result: TTuple = {
    ...initAST(schema as SchemaObject, ctx),
    type: ASTType.TUPLE,
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    params,
    spreadParam,
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
