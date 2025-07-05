import { standardLoader } from '@/core/loader';
import { ASTType, TInterface } from '@/type';
import type { ASTGenerator, GeneratorCtx, GeneratorResult } from './type';
import { getValue, setComment } from './utils';

export const recordTypeGenerator = (ast: TInterface, ctx: GeneratorCtx) => {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'type',
    code: ''
  };
  let addParamsStr = 'any';
  if (ast.addParams) {
    ctx.pathKey = '[key: string]';
    const nextResult = ctx.next(ast.addParams, ctx.options);
    addParamsStr = getValue(nextResult, ctx.options);
  }
  result.code = `Record<string, ${addParamsStr}>`;
  return result;
};
export const normalInterfaceGenerator = (ast: TInterface, ctx: GeneratorCtx) => {
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
    ctx.pathKey = keyName;
    const nextResult = ctx.next(param.ast, ctx.options);
    const value = getValue(nextResult, ctx.options);
    `${nextResult.comment ?? ''}${keyName}${optionalFlag}:${value}`.split('\n').forEach(line => lines.push(` ${line}`));
  });
  if (ast.addParams) {
    ctx.pathKey = '[key: string]';
    const nextResult = ctx.next(ast.addParams, ctx.options);
    lines.push(`[key: string]:${getValue(nextResult, ctx.options) || 'any'}`);
  }
  lines.push(`}`);
  result.code = lines.join('\n');
  return result;
};
export const interfaceTypeGenerator = (ast: TInterface, ctx: GeneratorCtx) => {
  if (ast.params.length > 0) {
    return normalInterfaceGenerator(ast, ctx);
  }
  return recordTypeGenerator(ast, ctx);
};
export default <ASTGenerator>{
  type: ASTType.INTERFACE,
  generate: interfaceTypeGenerator
};
