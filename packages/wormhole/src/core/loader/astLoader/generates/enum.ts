import { standardLoader } from '@/core/loader';
import { ASTType, TEnum } from '@/type';
import type { ASTGenerator, GeneratorCtx, GeneratorResult } from './type';
import { getValue, setComment } from './utils';

const normalEnumTypeGenerator = (ast: TEnum, ctx: GeneratorCtx) => {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'enum',
    code: ''
  };
  const lines: string[] = [`{`];
  ast.params.forEach((param, idx, arr) => {
    const paramResult = ctx.next(param.ast, ctx.options);
    const endText = idx === arr.length - 1 ? '' : ',';
    const keyName = standardLoader.validate(param.keyName) ? param.keyName : `"${param.keyName}"`;
    `${param.ast.comment ?? ''}${keyName} = ${paramResult.code}${endText}`
      .split('\n')
      .forEach(line => lines.push(` ${line}`));
  });
  lines.push(`}`);
  result.code = lines.join('\n');
  return result;
};
const otherEnumTypeGenerator = (ast: TEnum, ctx: GeneratorCtx) => {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'type',
    code: ''
  };
  result.code = ast.params.map(param => getValue(ctx.next(param.ast, ctx.options), ctx.options)).join(' | ');
  return result;
};
export const enumTypeGenerator = (ast: TEnum, ctx: GeneratorCtx) => {
  if (
    ast.params.every(
      item =>
        !ctx.options.deep && item.ast.type === ASTType.LITERAL && ['string', 'number'].includes(typeof item.ast.params)
    )
  ) {
    return normalEnumTypeGenerator(ast, ctx);
  }
  return otherEnumTypeGenerator(ast, ctx);
};

export default <ASTGenerator>{
  type: ASTType.ENUM,
  generate: enumTypeGenerator
};
