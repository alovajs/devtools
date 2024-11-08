import type { OpenAPIV3_1 } from 'openapi-types';

// Find the corresponding input attribute value

export type ConfigType = 'auto' | 'ts' | 'typescript' | 'module' | 'commonjs';
// template type

export type TemplateType = 'typescript' | 'module' | 'commonjs';
// platform type

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
export interface HandleApi {
  (apiDescriptor: ApiDescriptor): ApiDescriptor | void | undefined | null;
}
export type GeneratorConfig = {
  // Openapi json file url address

  input: string;
  // input: 'http://localhost:3000/openapi.json',
  // input: 'openapi/api.json' //Take the current project as the local address of the relative directory
  // input: 'http://192.168.5.123:8080' //When it does not point to the openapi file, it must be used with the platform parameter

  // Platforms that support openapi. Currently, swagger, knife4j, and yapi are supported. The default is empty.
  // When this parameter is specified, the input field only needs to specify the address of the document and does not need to be specified to the openapi file, reducing the usage threshold.
  // Different platforms have different openapi file addresses. Just read the file at the corresponding address according to the platform identification.

  platform?: PlatformType;

  // The output path of the interface file and type file, multiple generators cannot have repeated addresses, otherwise the generated codes will cover each other, which is meaningless.

  output: string;

  // (See below for details) Specify the media type of the generated response data. After specifying, use this data type to generate the response ts format of the 200 status code. The default is application/json.

  responseMediaType?: string;

  // (See below for details) Specify the media type of the generated request body data. After specifying, use this data type to generate the ts format of the request body. The default is application/json.

  bodyMediaType?: string;

  // The type of generated code. The optional value is auto/ts/typescript/module/commonjs. The default is auto. The type of the current project will be determined through certain rules.
  // ts/typescript: The same meaning means generating ts type files
  // module: generate esModule specification file
  // commonjs: means generating commonjs specification file

  type?: ConfigType;
  // Specify alova version

  version?: number;
  // Multiple projects use global fields

  global?: string;
  // The parent object of Global mounting, the default is global this

  globalHost?: string;
  // Whether to use import to import the type, the default is false
  // When this option is turned on, the generated apiDefinitions.ts file will use import syntax to import types instead of ///<reference types="..." />

  useImportType?: boolean;
  // When there is no require, it defaults to require, and only nullable takes effect.

  defaultRequire?: boolean;
  // (See below for details) Filter or convert the generated api interface function and return a new apiDescriptor to generate the api calling function
  // When this function is not specified, the apiDescriptor object is not converted.
  // The format of apiDescriptor is the same as the interface object format of the openapi file
  // The same goes for type generation

  handleApi?: HandleApi;
};
export type Config = {
  // API generation settings are arrays. Each item represents an automatically generated rule, including the generated input and output directories, specification file addresses, etc.
  // Currently, only OpenAPI specifications are supported, including OpenAPI 2.0 and 3.0 formats, but currently only 3.0 specifications are supported.

  generator: GeneratorConfig[];

  // Whether to automatically update the interface, enabled by default, checked every 5 minutes, closed when false

  autoUpdate?:
    | boolean
    | {
        // Updated when the editor is opened, default false

        launchEditor?: boolean;
        // Automatic update interval in milliseconds

        interval: number;
      };
};
export type GenerateApiOptions = {
  force?: boolean;
  projectPath?: string;
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
