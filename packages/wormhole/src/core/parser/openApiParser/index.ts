/* eslint-disable class-methods-use-this */
import type { PlatformType } from '@/interface.type';
import { OpenAPIV3_1 } from 'openapi-types';
import { Parser } from '../types';
import { getOpenApiData } from './helper';

export interface OpenApiParserOptions {
  projectPath?: string;
  platformType?: PlatformType;
}

export class OpenApiParser implements Parser<string, OpenAPIV3_1.Document, OpenApiParserOptions> {
  name = 'openapiParser';

  async parse(input: string, options?: OpenApiParserOptions): Promise<OpenAPIV3_1.Document> {
    return getOpenApiData(input, options?.projectPath, options?.platformType);
  }
}

export const openApiParser = new OpenApiParser();
