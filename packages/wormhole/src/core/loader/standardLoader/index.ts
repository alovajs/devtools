import type { Loader, OperationObject } from '@/type'
import { isValidJSIdentifier, makeIdentifier } from './helper'
import { getRandomVariable, getStandardOperationId, getStandardRefName, getStandardTags } from './standards'

export interface StandardLoaderOptions {
  style: 'camelCase' | 'snakeCase'
}

export class StandardLoader implements Loader<string, string, StandardLoaderOptions> {
  name = 'standardLoader'

  transform(input: string, options?: StandardLoaderOptions) {
    return makeIdentifier(input, options?.style ?? 'camelCase')
  }

  validate(input?: string): boolean {
    return isValidJSIdentifier(input)
  }

  transformRefName(
    refPath: string,
    options?: {
      toUpperCase?: boolean
    },
  ) {
    return getStandardRefName(refPath, {
      ...options,
      standardLoader: this,
    })
  }

  transformTags(tags?: string[]) {
    return getStandardTags(tags, {
      standardLoader: this,
    })
  }

  transformOperationId(
    pathObject: OperationObject,
    options: {
      url: string
      method: string
      map: Set<string>
    },
  ) {
    return getStandardOperationId(pathObject, {
      ...options,
      standardLoader: this,
    })
  }

  transformRadomVariable(value: string) {
    return getRandomVariable(value)
  }
}

export const standardLoader = new StandardLoader()
