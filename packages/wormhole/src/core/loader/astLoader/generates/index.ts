import { AST, ASTType } from '@/type';
import arrayTypeASTGenerator from './array';
import enumTypeASTGenerator from './enum';
import groupTypeASTGenerator from './group';
import interfaceTypeASTGenerator from './interface';
import simpleTypeASTGenerator from './simple';
import tupleTypeASTGenerator from './tuple';
import { GeneratorCtx, GeneratorOptions } from './type';
import { generate, getTsStr, getValue, normalizeCode } from './utils';

export * from './type';
const supportGenerator = [
  simpleTypeASTGenerator,
  enumTypeASTGenerator,
  interfaceTypeASTGenerator,
  groupTypeASTGenerator,
  arrayTypeASTGenerator,
  tupleTypeASTGenerator
];

export const astGenerate = (ast: AST, options: GeneratorOptions) => {
  const ctx: GeneratorCtx = {
    options,
    path: ['$'],
    next(ast, options) {
      const { pathKey } = ctx;
      if (pathKey) {
        ctx.path.push(pathKey);
        ctx.pathKey = '';
      }
      ctx.options = options;
      const result = doGenerate(ast, ctx);
      if (pathKey) {
        ctx.path.pop();
      }
      return result;
    }
  };
  const doGenerate = (ast: AST, ctx: GeneratorCtx) => {
    const value = generate(ast, ctx, supportGenerator);
    if (!value) {
      return simpleTypeASTGenerator.generate(
        {
          ...ast,
          type: ASTType.UNKNOWN
        },
        ctx
      );
    }
    return value;
  };
  return doGenerate(ast, ctx);
};

export { getTsStr, getValue, normalizeCode };
