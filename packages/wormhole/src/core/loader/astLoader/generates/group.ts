import { ASTType, TIntersection, TUnion } from '@/type';
import type { ASTGenerator, GeneratorCtx, GeneratorResult } from './type';
import { getValue, setComment } from './utils';

export const groupTypeGenerator = (ast: TIntersection | TUnion, ctx: GeneratorCtx) => {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'type',
    code: ''
  };
  const groups: string[] = [];
  ast.params.forEach(item => {
    groups.push(`(${getValue(ctx.next(item, ctx.options), ctx.options)})`);
  });

  switch (ast.type) {
    case ASTType.INTERSECTION:
      result.code = groups.join(' & ');
      break;
    case ASTType.UNION:
      result.code = groups.join(' | ');
      break;
    default:
      break;
  }
  return result;
};

export default <ASTGenerator>{
  type: [ASTType.INTERSECTION, ASTType.UNION],
  generate: groupTypeGenerator
};
