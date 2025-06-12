import type { AlovaVersion } from '@/functions/getAlovaVersion';
import type { TemplateType } from '@/infrastructure/config/types';
import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type OpenAPIDocument = OpenAPIV2.Document | OpenAPIV3.Document | OpenAPIV3_1.Document;
export type OpenAPI3Document = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type OpenAPI2Document = OpenAPIV2.Document;
export type SchemaObject = OpenAPIV3_1.SchemaObject;
export type Parameter = OpenAPIV3_1.ParameterObject;
export type OperationObject = OpenAPIV3_1.OperationObject;

export type ApiDescriptor = Omit<OperationObject, 'requestBody' | 'parameters' | 'responses'> & {
  url: string;
  method: string;
  parameters?: Parameter[];
  requestBody?: SchemaObject;
  responses?: SchemaObject;
};

export interface Api {
  tag: string;
  method: string;
  summary: string;
  path: string;
  pathParameters: string;
  queryParameters: string;
  pathParametersComment?: string;
  queryParametersComment?: string;
  responseComment?: string;
  requestComment?: string;
  name: string;
  global: string;
  responseName: string;
  requestName?: string;
  defaultValue?: string;
  pathKey: string;
}

export interface ApiDoc {
  apis: Api[];
  tag: string;
}

export interface Parser<T, U, O> {
  name: string;
  parse: (data: T, options: O) => Promise<U>;
}
type Path = {
  key: string;
  method: string;
  path: string;
};
export interface TemplateData extends Omit<OpenAPI3Document, ''> {
  // Define template data types
  // ...

  vue?: boolean;
  react?: boolean;
  moduleType?: 'commonJs' | 'ESModule';
  defaultKey?: boolean;
  baseUrl: string;
  pathsArr: Path[];
  schemas?: string[];
  pathApis: ApiDoc[];
  globalHost: string;
  global: string;
  alovaVersion: AlovaVersion;
  commentText: string;
  useImportType: boolean;
  type: TemplateType;
}
