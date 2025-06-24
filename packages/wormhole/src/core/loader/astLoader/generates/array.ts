import { ASTType, TArray } from '@/type';
import type { ASTGenerator, GeneratorCtx, GeneratorResult } from './type';
import { getValue, setComment } from './utils';

export const arrayTypeGenerator = (ast: TArray, ctx: GeneratorCtx) => {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'type',
    code: ''
  };
  const paramsResult = ctx.next(ast.params, ctx.options);
  if (ast.params.type === ASTType.INTERFACE) {
    result.code = `Array<${getValue(paramsResult, ctx.options)}>`;
  } else {
    result.code = `(${getValue(paramsResult, ctx.options)})[]`;
  }
  return result;
};

export default <ASTGenerator>{
  type: ASTType.ARRAY,
  generate: arrayTypeGenerator
};
