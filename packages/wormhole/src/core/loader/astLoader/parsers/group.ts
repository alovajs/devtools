import { logger } from '@/helper';
import { AbstractAST, ASTType, SchemaObject, TIntersection, TUnion } from '@/type';
import type { ASTParser, ParserCtx } from './type';
import { initAST } from './utils';

export const groupTypeParser = (schema: SchemaObject, ctx: ParserCtx) => {
  const result: AbstractAST = {
    ...initAST(schema, ctx)
  };
  if (schema.anyOf || schema.oneOf) {
    return {
      ...result,
      type: ASTType.UNION,
      params: (schema.anyOf || schema.oneOf)?.map(value => ctx.next(value, ctx.options)) ?? []
    } as TUnion;
  }
  if (schema.allOf) {
    // 显式检查 allOf
    return {
      ...result,
      type: ASTType.INTERSECTION,
      params: schema.allOf.map(value => ctx.next(value, ctx.options))
    } as TIntersection;
  }
  throw logger.throwError('schema must contain anyOf, oneOf or allOf', {
    schema
  });
};

export default <ASTParser>{
  type: 'group',
  parse: groupTypeParser
};
