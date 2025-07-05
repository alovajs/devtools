/* eslint-disable class-methods-use-this */
import type { AST, CommentType, Loader, MaybeSchemaObject, OpenAPIDocument } from '@/type';
import { astLoader } from '../astLoader';
import { GeneratorOptions, getValue } from '../astLoader/generates';

export interface Schema2TypeOptions {
  deep?: boolean; // Whether to parse recursively
  shallowDeep?: boolean; // Only the outermost layer is analytic
  commentType?: CommentType; // Comment style
  preText?: string; // annotation prefix
  defaultRequire?: boolean; // If there is no nullbale or require, the default is require.
}
export interface SchemaLoaderOptions extends Schema2TypeOptions {
  document: OpenAPIDocument;
  onReference?: (ast: AST) => void;
}
export class SchemaLoader implements Loader<MaybeSchemaObject, Promise<string>, SchemaLoaderOptions> {
  name = 'schemaLoader';

  async transform(schemaOrigin: MaybeSchemaObject, options: SchemaLoaderOptions) {
    const ast = await astLoader.transformSchema(schemaOrigin, {
      document: options.document,
      commentType: options.commentType ?? 'line',
      defaultRequire: options.defaultRequire,
      onReference(ast) {
        options.onReference?.(ast);
      }
    });
    const genOptions: GeneratorOptions = {
      deep: options.deep,
      shallowDeep: options.shallowDeep,
      commentType: options.commentType ?? 'line'
    };
    const result = await astLoader.transform(ast, {
      ...genOptions,
      format: true
    });
    const tsStrArr = getValue(result, {
      ...genOptions
    })
      .trim()
      .split('\n');
    return tsStrArr.map((line, idx) => (idx ? options.preText : '') + line).join('\n');
  }
}

export const schemaLoader = new SchemaLoader();
