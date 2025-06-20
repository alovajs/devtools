/* eslint-disable class-methods-use-this */
import type { AST, Loader } from '@/type';
import { astGenerate, normalizeCode, type GeneratorOptions, type GeneratorResult } from './generates';

export interface AstLoaderOptions extends GeneratorOptions {
  format?: boolean;
}

export class AstLoader implements Loader<AST, Promise<GeneratorResult>, AstLoaderOptions> {
  name = 'astLoader';

  async transform(ast: AST, options: AstLoaderOptions) {
    const result = astGenerate(ast, options);
    if (options.format) {
      result.code = await normalizeCode(result.code, result.type);
    }
    return result;
  }
}

export const astLoader = new AstLoader();
