import { standardLoader } from '@/core/loader/standardLoader';
import { CommentHelper } from '@/helper';
import { AST, ASTType, ReferenceObject, TReference } from '@/type';
import { dereference } from '@/utils';
import type { ASTParser, ParserCtx } from './type';
import { initAST } from './utils';

export const referenceTypeParser = (schema: ReferenceObject, ctx: ParserCtx): AST => {
  const refName = standardLoader.transformRefName(schema.$ref);
  const refernceAST: TReference = {
    ...initAST(schema, ctx),
    type: ASTType.REFERENCE,
    params: refName
  };
  if (ctx.visited.has(schema.$ref)) {
    refernceAST.comment = CommentHelper.load({
      type: ctx.options.commentType,
      comment: refernceAST.comment
    })
      .add('[cycle]', ctx.path.join('.'))
      .end();
    return refernceAST;
  }
  ctx.visited.add(schema.$ref);
  ctx.keyName = refName;
  const result = ctx.next(dereference(schema, ctx.options.document), ctx.options);
  ctx.options.onReference?.(result);
  ctx.visited.delete(schema.$ref);
  return result;
};

export default <ASTParser>{
  type: 'reference',
  parse: referenceTypeParser
};
