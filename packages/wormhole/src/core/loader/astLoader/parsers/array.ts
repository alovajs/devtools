import { CommentHelper } from '@/helper';
import { ASTType, ArraySchemaObject, TArray } from '@/type';
import type { ASTParser, ParserCtx } from './type';
import { initAST } from './utils';

export const arrayTypeParser = (schema: ArraySchemaObject, ctx: ParserCtx) => {
  ctx.pathKey = '[]';
  const itemsAst = ctx.next(schema.items, ctx.options);
  const result: TArray = {
    ...initAST(schema, ctx),
    type: ASTType.ARRAY,
    params: itemsAst
  };
  result.deepComment = CommentHelper.load({
    type: ctx.options.commentType
  })
    .add('[items] start')
    .add(CommentHelper.parse(itemsAst.comment ?? '').join('\n'))
    .add(CommentHelper.parse(itemsAst.deepComment ?? '').join('\n'))
    .add('[items] end')
    .end();
  return result;
};
export default <ASTParser>{
  type: 'array',
  parse: arrayTypeParser
};
