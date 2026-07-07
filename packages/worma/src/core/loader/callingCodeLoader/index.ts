import type { Api, Loader } from '@/type'
import { format } from '@/utils'

import { generateDefaultValues, generateDefaultValuesFormat } from './helper'

export interface CallingCodeLoaderOptions {
  format?: boolean
}

export class CallingCodeLoader implements Loader<string, Promise<string>, CallingCodeLoaderOptions> {
  name = 'callingCodeLoader'

  transform(input: string, options?: CallingCodeLoaderOptions) {
    if (options?.format) {
      return generateDefaultValuesFormat(input)
    }
    return Promise.resolve(generateDefaultValues(input))
  }

  async transformApi(api: Api) {
    const configStrArr: string[] = []
    if (api.pathParametersComment) {
      configStrArr.push(`pathParams: ${await this.transform(api.pathParametersComment.replace(/\*/g, ''))}`)
    }
    if (api.queryParametersComment) {
      configStrArr.push(`params: ${await this.transform(api.queryParametersComment.replace(/\*/g, ''))}`)
    }
    if (api.requestBodyComment) {
      configStrArr.push(`data: ${await this.transform(api.requestBodyComment.replace(/\*/g, ''))}`)
    }
    return format(`${api.name}({${configStrArr.join(',\n')}})`, {
      printWidth: 40, // Shorten print width to force line breaks
      tabWidth: 2,
      semi: false, // Remove the trailing semicolon
      useTabs: false,
      trailingComma: 'none',
      endOfLine: 'lf',
      bracketSpacing: true,
      arrowParens: 'always',
    })
  }
}

export const callingCodeLoader = new CallingCodeLoader()
