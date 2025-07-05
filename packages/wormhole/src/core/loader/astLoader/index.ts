/* eslint-disable class-methods-use-this */
import type { AST, Loader, SchemaObject } from '@/type';
import { type GeneratorResult, getTsStr } from './generates';
import { ParserOptions, transformAST, TransformAstOptions, transformSchema } from './helper';

export interface AstLoaderOptions extends TransformAstOptions {}

export interface AStLoaderTsStrOptions extends AstLoaderOptions {
  export?: boolean;
}

export class AstLoader implements Loader<AST, Promise<GeneratorResult>, AstLoaderOptions> {
  name = 'astLoader';

  async transform(ast: AST, options: AstLoaderOptions) {
    return transformAST(ast, options);
  }
  async transformSchema(schema: SchemaObject, options: ParserOptions) {
    return transformSchema(schema, options);
  }
  async transformTsStr(ast: AST, options: AStLoaderTsStrOptions) {
    const result = await this.transform(ast, options);
    return getTsStr(result, {
      export: options.export
    });
  }
}

export const astLoader = new AstLoader();
