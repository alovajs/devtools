import { MethodType, RequestBody } from 'alova';
import { OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod/v3';

export type OpenAPIDocument = OpenAPIV3_1.Document;
export type SchemaObject = OpenAPIV3_1.SchemaObject;
export type Parameter = OpenAPIV3_1.ParameterObject;
export type OperationObject = OpenAPIV3_1.OperationObject;
export interface FetchOptions {
	headers?: Record<string, string>;
	/** timeout in milliseconds */
	timeout?: number;
	method?: MethodType;
	data?: RequestBody;
	params?: Record<string, any>;
	/** when true, do not throw on non-2xx but still return text; default false */
	insecure?: boolean;
}
declare const zConfigType: z.ZodEnum<[
	"auto",
	"ts",
	"typescript",
	"module",
	"commonjs"
]>;
declare const zTemplateType: z.ZodEnum<[
	"typescript",
	"module",
	"commonjs"
]>;
declare const zPlatformType: z.ZodEnum<[
	"swagger",
	"knife4j",
	"yapi"
]>;
/**
 * Find the corresponding input attribute value
 */
export type ConfigType = z.infer<typeof zConfigType>;
/**
 * template type
 */
export type TemplateType = z.infer<typeof zTemplateType>;
/**
 * platform type
 */
export type PlatformType = z.infer<typeof zPlatformType> | (string & {});
export type MaybePromise<T> = T | Promise<T>;
export interface ApiPlugin {
	name?: string;
	/**
	 * Replaces or manipulates the options object passed to wormhole.
	 * Returning null does NOT replacing anything.
	 */
	config?: (config: GeneratorConfig) => MaybePromise<GeneratorConfig | undefined | null | void>;
	/**
	 * Manipulate the input config before parsing the openapi file.
	 * Returning null does NOT replacing anything.
	 */
	beforeOpenapiParse?: (inputConfig: Pick<GeneratorConfig, "input" | "platform" | "plugins" | "fetchOptions">) => MaybePromise<Pick<GeneratorConfig, "input" | "platform" | "plugins" | "fetchOptions"> | undefined | null | void>;
	/**
	 * Manipulate the openapi document after parsing.
	 * Returning null does NOT replacing anything.
	 */
	afterOpenapiParse?: (document: OpenAPIDocument) => MaybePromise<OpenAPIDocument | undefined | null | void>;
	/**
	 * Manipulate the template code before generating.
	 * Returning null does NOT replacing anything.
	 */
	beforeCodeGenerate?: (data: any, outputFile: string, ctx: {
		renderTemplate: () => Promise<string>;
		fileName: string;
	}) => MaybePromise<string | undefined | null | void>;
	/**
	 * Called when wormhold has finished code generating.
	 */
	afterCodeGenerate?: (error?: Error) => void;
}
export interface HandleApi {
	(apiDescriptor: ApiDescriptor): ApiDescriptor | void | undefined | null;
}
export interface GeneratorConfig {
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
	fetchOptions?: FetchOptions;
	/**
	 * A list of type identifiers to exclude from generation.
	 * Matches against type names parsed from the OpenAPI schema; matched types
	 * are skipped and referenced directly by their identifier in generated code
	 * to avoid duplicate or conflicting declarations.
	 * Use this when you already have hand-written types or types provided by
	 * frameworks/libraries that should not be generated.
	 *
	 * @example
	 * externalTypes: ['File', 'Blob', 'FormData', 'Pagination']
	 */
	externalTypes?: string[];
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
	version?: number | string;
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
	 * plugin will be executed before `handleApi`
	 */
	plugins?: ApiPlugin[];
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
	/**
	 * Control the format of output file names. Supports presets or a custom function.
	 * Only affects the output file name, and does not affect template filename resolution.
	 * Presets: 'camelCase' | 'pascalCase' | 'kebabCase' | 'snakeCase'
	 */
	fileNameCase?: "camelCase" | "pascalCase" | "kebabCase" | "snakeCase" | ((name: string) => string);
}
export interface Config {
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
	autoUpdate?: boolean | {
		/**
		 * Updated when the editor is opened
		 */
		launchEditor?: boolean;
		/**
		 * Automatic update interval in milliseconds
		 */
		interval: number;
	};
}
export type UserConfig = Config;
export type UserConfigFnObject = () => UserConfig;
export type UserConfigFnPromise = () => Promise<UserConfig>;
export type UserConfigFn = () => UserConfig | Promise<UserConfig>;
export type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFnObject | UserConfigFnPromise | UserConfigFn;
export type AlovaVersion = `v${number}`;
export type ModuleType = "commonJs" | "ESModule";
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
export type ApiDescriptor = Omit<OperationObject, "requestBody" | "parameters" | "responses"> & {
	url: string;
	method: string;
	parameters?: Parameter[];
	refNameMap?: Record<string, string>;
	requestBody?: SchemaObject;
	responses?: SchemaObject;
};
export interface ApiPath {
	key: string;
	method: string;
	path: string;
}
export interface TemplateData extends Omit<OpenAPIDocument, ""> {
	vue?: boolean;
	react?: boolean;
	moduleType?: ModuleType;
	defaultKey?: boolean;
	baseUrl: string;
	pathsArr: ApiPath[];
	schemas?: string[];
	pathApis: ApiDoc[];
	globalHost: string;
	global: string;
	alovaVersion: AlovaVersion;
	commentText: string;
	useImportType: boolean;
	type: TemplateType;
	createApisFileName?: string;
	apiDefinitionsFileName?: string;
	globalsDFileName?: string;
	indexFileName?: string;
}
export interface GenerateApiOptions {
	force?: boolean;
	projectPath?: string;
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
/**
 * Create a templated configuration file.
 * @param options - Configuration file creation options
 * @param options.projectPath - The root path of the project (optional)
 * @param options.type - The template type to use (optional)
 * @returns A promise that resolves when the config is created
 */
export declare function createConfig({ projectPath, type }?: ConfigCreationOptions): Promise<void>;
/**
 * Type helper to make it easier to use alova.config.ts
 * accepts a direct {@link UserConfig} object, or a function that returns it.
 */
export declare function defineConfig(config: UserConfig): UserConfig;
export declare function defineConfig(config: Promise<UserConfig>): Promise<UserConfig>;
export declare function defineConfig(config: UserConfigFnObject): UserConfigFnObject;
export declare function defineConfig(config: UserConfigFnPromise): UserConfigFnPromise;
export declare function defineConfig(config: UserConfigFn): UserConfigFn;
export declare function defineConfig(config: UserConfigExport): UserConfigExport;
/**
 * Generate relevant API information based on the configuration object. Generally, it needs to be used with `readConfig()`.
 * @param config generating config
 * @param rules config rules that contains `force`, `projectPath`
 * @returns An array that contains the result of `generator` items in configuration whether generation is successful.
 */
export declare function generate(config: Config, rules?: GenerateApiOptions): Promise<boolean[]>;
/**
 * Read the alova.config configuration file and return the parsed configuration object.
 * @param projectPath The project path where the configuration file is located. The default value is `process.cwd()`.
 * @returns a promise instance that contains configuration object.
 */
export declare function readConfig(projectPath?: string): Promise<Config>;
export declare function getAutoUpdateConfig(config: Config): Promise<{
	time: number;
	isStop: boolean;
	immediate: boolean;
}>;
export declare function getApiDocs(config: Config, projectPath?: string): Promise<ApiDoc[][]>;
/**
 * Search for all directories containing alova.config configuration files under the monorepo project. It will search for configuration files based on `workspaces` in `package.json` or sub packages defined in `pnpm-workspace.yaml`
 * @param projectPath The project path to search, defaults to `process.cwd()`.
 * @returns An array of relative paths to directories containing alova.config configuration files.
 */
export function resolveWorkspaces(projectPath?: string): Promise<string[]>;

export {};
