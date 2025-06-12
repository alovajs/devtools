/* eslint-disable class-methods-use-this */
import { standardLoader } from '@/core/loader';
import type { Loader, OpenAPIDocument } from '@/type';
import { findBy$ref } from '@/utils/openapi';
import { convertToType, Schema2TypeOptions, SchemaOrigin } from './helper';

export interface SchemaLoaderOptions extends Schema2TypeOptions {
  document: OpenAPIDocument;
}
export interface Schema2TsStrOptions {
  document: OpenAPIDocument;
  name: string;
  export?: boolean;
  defaultRequire?: boolean; // If there is no nullbale or require, the default is require.
  on$RefTsStr?: (name: string, tsStr: string) => void;
  searchMap?: Map<string, string>;
  map?: Map<string, string>;
  visited?: Set<string>;
}
export class SchemaLoader implements Loader<SchemaOrigin, Promise<string>, SchemaLoaderOptions> {
  name = 'schemaLoader';

  transform(schemaOrigin: SchemaOrigin, options: SchemaLoaderOptions) {
    return convertToType(schemaOrigin, options.document, options);
  }
  async transformTsStr(schemaOrigin: SchemaOrigin, _options: Schema2TsStrOptions) {
    const options = {
      export: false,
      defaultRequire: false,
      searchMap: new Map<string, string>(),
      map: new Map<string, string>(),
      visited: new Set<string>(),
      ..._options
    };
    const tsStr = await this.transform(schemaOrigin, {
      document: options.document,
      shallowDeep: true,
      defaultType: 'unknown',
      commentStyle: 'document',
      preText: '',
      searchMap: options.searchMap,
      defaultRequire: options.defaultRequire,
      on$Ref: async refObject => {
        if (!options.on$RefTsStr) {
          return;
        }
        const name = standardLoader.transformRefName(refObject.$ref);
        if (options.map.has(name)) {
          options.on$RefTsStr(name, options.map.get(name) ?? '');
          return;
        }
        if (options.visited.has(refObject.$ref)) {
          return;
        }
        options.visited.add(refObject.$ref);
        const result = await this.transformTsStr(findBy$ref(refObject.$ref, options.document), {
          ...options,
          name
        });
        options.map.set(name, result);
        options.on$RefTsStr(name, result);
      }
    });
    let result = `type ${options.name} = ${tsStr}`;
    if (options.export) {
      result = `export ${result}`;
    }
    return result;
  }
}

export const schemaLoader = new SchemaLoader();
