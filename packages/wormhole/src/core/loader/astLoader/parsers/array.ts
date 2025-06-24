import { ASTType, ArraySchemaObject, TArray } from '@/type';
import type { ASTParser, ParserCtx } from './type';
import { initAST } from './utils';

export const arrayTypeParser = (schema: ArraySchemaObject, ctx: ParserCtx) => {
  const result: TArray = {
    ...initAST(schema, ctx),
    type: ASTType.ARRAY,
    params: ctx.next(schema.items, ctx.options)
  };
  return result;
};

export default <ASTParser>{
  type: 'array',
  parse: arrayTypeParser
};
