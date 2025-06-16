/* eslint-disable class-methods-use-this */
import type { Api, Loader } from '@/type';
import { format } from '@/utils';

import { generateDefaultValues, generateDefaultValuesFormat } from './helper';

export interface DefaultValueLoaderOptions {
  format?: boolean;
}

export class DefaultValueLoader implements Loader<string, Promise<string>, DefaultValueLoaderOptions> {
  name = 'defaultValueLoader';

  transform(input: string, options?: DefaultValueLoaderOptions) {
    if (options?.format) {
      return generateDefaultValuesFormat(input);
    }
    return Promise.resolve(generateDefaultValues(input));
  }
  async transformApi(api: Api) {
    const configStrArr: string[] = [];
    if (api.pathParametersComment) {
      configStrArr.push(`pathParams: ${await this.transform(api.pathParametersComment.replace(/\*/g, ''))}`);
    }
    if (api.queryParametersComment) {
      configStrArr.push(`params: ${await this.transform(api.queryParametersComment.replace(/\*/g, ''))}`);
    }
    if (api.requestComment) {
      configStrArr.push(`data: ${await this.transform(api.requestComment.replace(/\*/g, ''))}`);
    }
    return format(`${api.global}.${api.pathKey}({${configStrArr.join(',\n')}})`, {
      printWidth: 40, // Shorten print width to force line breaks
      tabWidth: 2,
      semi: false, // Remove the trailing semicolon
      useTabs: false,
      trailingComma: 'none',
      endOfLine: 'lf',
      bracketSpacing: true,
      arrowParens: 'always'
    });
  }
}

export const defaultValueLoader = new DefaultValueLoader();
