import { standardLoader } from '@/core/loader';
import { ASTType, TInterface } from '@/type';
import type { ASTGenerator, GeneratorCtx, GeneratorResult } from './type';
import { getValue, setComment } from './utils';

export const interfaceTypeGenerator = (ast: TInterface, ctx: GeneratorCtx) => {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'interface',
    code: ''
  };
  const lines: string[] = [`{`];
  ast.params.forEach(param => {
    const optionalFlag = param.isRequired ? '' : '?';
    const keyName = standardLoader.validate(param.keyName) ? param.keyName : `"${param.keyName}"`;
    const nextResult = ctx.next(param.ast, ctx.options);
    const value = getValue(nextResult, ctx.options);
    `${nextResult.comment ?? ''}${keyName}${optionalFlag}:${value}`.split('\n').forEach(line => lines.push(` ${line}`));
  });
  lines.push(`}`);
  result.code = lines.join('\n');
  return result;
};
export default <ASTGenerator>{
  type: ASTType.INTERFACE,
  generate: interfaceTypeGenerator
};
