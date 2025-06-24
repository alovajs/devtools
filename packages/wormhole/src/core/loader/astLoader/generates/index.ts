import { AST, ASTType } from '@/type';
import arrayTypeASTGenerator from './array';
import enumTypeASTGenerator from './enum';
import groupTypeASTGenerator from './group';
import interfaceTypeASTGenerator from './interface';
import simpleTypeASTGenerator from './simple';
import tupleTypeASTGenerator from './tuple';
import { GeneratorCtx, GeneratorOptions } from './type';
import { generate, normalizeCode } from './utils';

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
    next(ast, options) {
      return astGenerate(ast, options);
    }
  };
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

export { normalizeCode };
