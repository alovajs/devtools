/* eslint-disable class-methods-use-this */
import type { OpenAPIDocument, Parser, PlatformType } from '@/type';
import { getOpenApiData } from './helper';

export interface OpenApiParserOptions {
  projectPath?: string;
  platformType?: PlatformType;
}

export class OpenApiParser implements Parser<string, OpenAPIDocument, OpenApiParserOptions> {
  name = 'openapiParser';

  async parse(input: string, options?: OpenApiParserOptions): Promise<OpenAPIDocument> {
    return getOpenApiData(input, options?.projectPath, options?.platformType);
  }
}

export const openApiParser = new OpenApiParser();
