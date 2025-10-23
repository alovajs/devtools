import type { OpenAPIDocument, Parser, PlatformType } from '@/type'
import type { FetchOptions } from '@/utils/base'
import { getOpenApiData } from './helper'

export interface OpenApiParserOptions {
  projectPath?: string
  platformType?: PlatformType
  fetchOptions?: FetchOptions
}

export class OpenApiParser implements Parser<string, OpenAPIDocument, OpenApiParserOptions> {
  name = 'openapiParser'

  async parse(input: string, options?: OpenApiParserOptions): Promise<OpenAPIDocument> {
    return getOpenApiData(input, options)
  }
}

export const openApiParser = new OpenApiParser()
