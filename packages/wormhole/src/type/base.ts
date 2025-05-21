import type { OpenAPIV3_1 } from 'openapi-types';
/**
 * Find the corresponding input attribute value
 */
export type ConfigType = 'auto' | 'ts' | 'typescript' | 'module' | 'commonjs';
/**
 * template type
 */
export type TemplateType = 'typescript' | 'module' | 'commonjs';
/**
 * platform type
 */
export type PlatformType = 'swagger' | 'knife4j' | 'yapi';
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
/**
 * Generated api description information
 */
export interface Api {
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
