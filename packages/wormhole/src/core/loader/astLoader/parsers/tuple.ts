import { ASTType, SchemaObject, TTuple, TupleSchemaObject } from '@/type';
import type { ASTParser, ParserCtx } from './type';
import { initAST } from './utils';

export const tupleTypeParser = (schema: TupleSchemaObject, ctx: ParserCtx) => {
  const result: TTuple = {
    ...initAST(schema as SchemaObject, ctx),
    type: ASTType.TUPLE,
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    params: schema.items.map(item => ctx.next(item, ctx.options))
  };
  return result;
};

export default <ASTParser>{
  type: 'tuple',
  parse: tupleTypeParser
};
