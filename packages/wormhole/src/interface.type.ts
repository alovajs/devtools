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
export interface HandleApi {
  (apiDescriptor: ApiDescriptor): ApiDescriptor | void | undefined | null;
}
export type GeneratorConfig = {
  /**
   * Openapi file path, it supports json and yaml file, and network url
   * @requires true
   *
   * @example
   * input: 'http://localhost:3000/openapi.json'
   * input: 'openapi/api.json' -> Take the current project as the local address of the relative directory
   * input: 'http://192.168.5.123:8080' -> When it does not point to the openapi file, it must be used with the `platform` parameter
   */

  input: string;

  /**
   * Platforms that support openapi. Currently `swagger` are supported. The default is empty.
   * When this parameter is specified, the input field only needs to specify the url of the document and doesn't need to be specified to the openapi file, reducing the usage threshold.
   * @defualt undefined
   */
  platform?: PlatformType;

  /**
   * The output path of the interface file and type file, multiple generators cannot have repeated addresses, otherwise the generated codes will cover each other, which is meaningless.
   * @requires true
   */
  output: string;

  /**
   * Specify the media type of the generated response data. After specifying, use this data type to generate the response ts format of the 2xx status code.
   * @defualt 'application/json'
   */

  responseMediaType?: string;

  /**
   * Specify the media type of the generated request body data. After specifying, use this data type to generate the ts format of the request body.
   * @default 'application/json'
   */
  bodyMediaType?: string;

  /**
   * The type of generated code. The optional value is `auto/ts/typescript/module/commonjs`.
   * default is `auto`, it means the type of current project will be determined through certain rules.
   *
   * @param type
   * 1. ts/typescript: The same meaning means generating ts type files
   * 2. module: generate esModule specification file
   * 3. commonjs: means generating commonjs specification file
   *
   * @default 'auto'
   */
  type?: ConfigType;

  /**
   * Specify alova version, 2 or 3, if not specified, it will be automatically determined through the alova version in `package.json`
   */
  version?: number;

  /**
   * Globally exported api name, you can access the automatically generated api globally through this name.
   * it is required when multiple generators are configured, and it cannot be repeated
   *
   * @default 'Apis'
   */
  global?: string;

  /**
   * The host object of global mounting, default is `globalThis`, it means `window` in browser and `global` in nodejs
   *
   * @default 'globalThis'
   */
  globalHost?: string;

  /**
   * Whether to use `import` statement to import the type. When this option is set to `true`, the generated apiDefinitions.ts file will use `import` statement to import types instead of ///<reference types="..." />
   *
   * @default false
   */
  useImportType?: boolean;

  /**
   * When there is no require, it defaults to require, and only nullable takes effect.
   */
  defaultRequire?: boolean;

  /**
   * Filter or convert the generated api function and return a new `apiDescriptor` to generate the api.
   * When this function is not specified, `apiDescriptor` object is not converted.
   * The type of `apiDescriptor` is the same as the api item of openapi file.
   *
   * @see https://spec.openapis.org/oas/v3.1.0.html#operation-object
   *
   * @example
   * ```js
   * // Do not generate the apis that starts with `/user`
   * handleApi(apiDescriptor) {
   *   if (apiDescriptor.path.startsWith('/user')) {
   *     return;
   *   }
   *   return apiDescriptor;
   * }
   * ```
   *
   * ```js
   * // modify the api's parameters
   * handleApi(apiDescriptor) {
   *   apiDescriptor.parameters = (apiDescriptor.parameters || []).filter(
   *     param => param.in === 'header' && param.name === 'token'
   *   );
   *   delete apiDescriptor.requestBody.id;
   *   apiDescriptor.url = apiDescriptor.url.replace('/user', '');
   *   return apiDescriptor;
   * }
   * ```
   */
  handleApi?: HandleApi;
};
export type Config = {
  /**
   * API generation settings are arrays. Each item represents an automatically generated rule, including the generated input and output directories, specification file addresses, etc.
   * Currently, only OpenAPI specifications are supported, including OpenAPI 2.0 and 3.0 specifications.
   */
  generator: GeneratorConfig[];

  /**
   * Whether to automatically update the interface.
   * default is `true`, checked every 5 minutes, set `false` to close it
   *
   * @default true
   */
  autoUpdate?:
    | boolean
    | {
        /**
         * Updated when the editor is opened
         */
        launchEditor?: boolean;
        /**
         * Automatic update interval in milliseconds
         */
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
