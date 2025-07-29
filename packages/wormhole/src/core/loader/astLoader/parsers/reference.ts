import type { ASTParser, ParserCtx } from './type'
import type { AST, MaybeSchemaObject, ReferenceObject, SchemaObject, TReference } from '@/type'
import { standardLoader } from '@/core/loader/standardLoader'
import { CommentHelper } from '@/helper'
import { ASTType } from '@/type'
import { dereference } from '@/utils'
import normalizer from '../normalize'
import { initAST } from './utils'

export function referenceTypeParser(schema: ReferenceObject, ctx: ParserCtx): AST {
  const refName = standardLoader.transformRefName(schema.$ref)
  const refernceAST: TReference = {
    ...initAST(schema, ctx),
    type: ASTType.REFERENCE,
    params: refName,
  }
  if (ctx.visited.has(schema.$ref)) {
    refernceAST.deepComment = CommentHelper.load({
      type: ctx.options.commentType,
    })
      .add('[cycle]', ctx.pathMap.get(schema.$ref))
      .end()
    return refernceAST
  }
  const nextSchema: SchemaObject = normalizer.normalize(dereference<MaybeSchemaObject>(schema, ctx.options.document))
  ctx.visited.add(schema.$ref)
  ctx.pathMap.set(schema.$ref, ctx.path.join('.'))
  ctx.keyName = refName
  const result = ctx.next(nextSchema, ctx.options)
  ctx.options.onReference?.(result)
  ctx.visited.delete(schema.$ref)
  return result
}

export default <ASTParser>{
  type: 'reference',
  parse: referenceTypeParser,
}
