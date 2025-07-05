import { AST, MaybeSchemaObject } from '@/type';
import { astGenerate, normalizeCode } from './generates';
import { GeneratorOptions } from './generates/type';
import normalizer from './normalize';
import { astParse, type ParserOptions } from './parsers';

export interface TransformAstOptions extends GeneratorOptions {
  format?: boolean;
}
export async function transformAST(ast: AST, options: TransformAstOptions) {
  const result = astGenerate(ast, options);
  if (options.format) {
    result.code = await normalizeCode(result.code, result.type);
  }
  return result;
}

export async function transformSchema(schema: MaybeSchemaObject, options: ParserOptions) {
  const normalized = normalizer.normalize(schema);
  return astParse(normalized, options);
}
export { ParserOptions };
