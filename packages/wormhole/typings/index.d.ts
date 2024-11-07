import { OpenAPIV3_1 } from 'openapi-types';

export type ConfigType = 'auto' | 'ts' | 'typescript' | 'module' | 'commonjs';
export type TemplateType = 'typescript' | 'module' | 'commonjs';
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
  input: string;
  platform?: PlatformType;
  output: string;
  responseMediaType?: string;
  bodyMediaType?: string;
  type?: ConfigType;
  version?: number;
  global?: string;
  globalHost?: string;
  useImportType?: boolean;
  defaultRequire?: boolean;
  handleApi?: HandleApi;
};
export type Config = {
  generator: GeneratorConfig[];
  autoUpdate?:
    | boolean
    | {
        launchEditor?: boolean;
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
export type AlovaVersion = `v${number}`;
export type Path = {
  key: string;
  method: string;
  path: string;
};
export interface PathApis {
  tag: string;
  apis: Api[];
}
export interface TemplateData extends Omit<OpenAPIV3_1.Document, ''> {
  vue?: boolean;
  react?: boolean;
  moduleType?: 'commonJs' | 'ESModule';
  defaultKey?: boolean;
  baseUrl: string;
  pathsArr: Path[];
  schemas?: string[];
  pathApis: PathApis[];
  globalHost: string;
  global: string;
  alovaVersion: AlovaVersion;
  commentText: string;
  useImportType: boolean;
  type: TemplateType;
}
declare const DEFAULT_CONFIG: {
  alovaTempPath: string;
  templatePath: string;
  templateData: Map<string, TemplateData>;
  Error: ErrorConstructor;
};
export declare function setGlobalConfig(config: Partial<typeof DEFAULT_CONFIG>): void;
export interface ConfigCreationOptions {
  projectPath?: string;
  type?: TemplateType;
}
export declare const createConfig: ({ projectPath, type }?: ConfigCreationOptions) => Promise<void>;
/**
 * generate apis based on config
 * @param config generating config
 * @param rules config rules
 * @returns
 */
export declare const generate: (config: Config, rules?: GenerateApiOptions) => Promise<boolean[]>;
export declare const readConfig: (projectPath?: string) => Promise<Config>;
export declare const getAutoUpdateConfig: (config: Config) => {
  time: number;
  isStop: boolean;
  immediate: boolean;
};
export declare const getApis: (config: Config, projectPath?: string) => Api[];
/**
 * Find all directories containing alova.config.js files
 * @param rootPath root directory
 * @returns Array of directories containing alova.config.js files
 */
export function resolveWorkspaces(rootPath?: string): Promise<string[]>;

export {};
