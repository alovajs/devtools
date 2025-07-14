import { OpenAPIV3_1 } from 'openapi-types';
import { z } from 'zod';

export type OpenAPIDocument = OpenAPIV3_1.Document;
export type SchemaObject = OpenAPIV3_1.SchemaObject;
export type Parameter = OpenAPIV3_1.ParameterObject;
export type OperationObject = OpenAPIV3_1.OperationObject;
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
export type PlatformType = z.infer<typeof zPlatformType>;
export interface ApiPlugin {
	name?: string;
	extends?: Partial<GeneratorConfig> | ((config: GeneratorConfig) => Partial<GeneratorConfig>);
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
 * Generate relevant API information based on the configuration object. Generally, it needs to be used with `readConfig()`.
 * @param config generating config
 * @param rules config rules that contains `force`, `projectPath`
 * @returns An array that contains the result of `generator` items in configuration whether generation is successful.
 */
export declare function generate(config: Config, rules?: GenerateApiOptions): Promise<boolean[]>;
/**
 * Creates a plugin factory function with proper typing
 *
 * @param plugin - Function that creates a plugin instance
 * @returns The original plugin function with proper typing
 *
 * @example
 * // Create a custom plugin
 * const myPlugin = createPlugin((options: MyOptions) => ({
 *   handleApi: (apiDescriptor) => {
 *     // Plugin implementation
 *     return apiDescriptor;
 *   }
 * }));
 *
 * // Use the plugin
 * generate({
 *   generator: [{
 *     // ...
 *     plugins: [myPlugin({ key: 'value' })]
 *   }]
 * });
 */
export declare function createPlugin<T extends any[]>(plugin: (...args: T) => ApiPlugin): (...args: T) => ApiPlugin;
/**
 * Filter configuration interface
 */
export interface FilterApiConfig {
	/**
	 * Target scope for filtering, defaults to 'url'
	 */
	scope?: "url" | "tag";
	/**
	 * Include rule:
	 * - string: target contains this string
	 * - RegExp: target matches this pattern
	 * - function: custom matching logic
	 */
	include?: string | RegExp | ((key: string) => boolean);
	/**
	 * Exclude rule:
	 * - string: target contains this string
	 * - RegExp: target matches this pattern
	 * - function: custom matching logic
	 */
	exclude?: string | RegExp | ((key: string) => boolean);
}
/**
 * Main processing function for filtering API descriptors
 * @param apiDescriptor API descriptor
 * @param configs Configuration array
 * @returns Filtered API descriptor, or null if filtered out
 */
export declare function filterApiDescriptor(apiDescriptor: ApiDescriptor, configs: FilterApiConfig[]): ApiDescriptor | null;
/**
 * Creates a plugin for filtering APIs
 *
 * @param config Filter configuration, can be a single config or array of configs
 * @returns API plugin instance
 *
 * @example
 * ```ts
 * // Only include URLs containing 'user'
 * const userOnlyFilter = apiFilter({
 *   include: 'user'
 * });
 *
 * // Exclude tags containing 'internal'
 * const noInternalFilter = apiFilter({
 *   scope: 'tag',
 *   exclude: 'internal'
 * });
 *
 * // Multi-condition filtering (union)
 * const multiFilter = apiFilter([
 *   { include: 'user' },
 *   { include: 'admin' }
 * ]);
 * ```
 */
export declare function apiFilter(config: FilterApiConfig | FilterApiConfig[]): ApiPlugin;
/**
 * Rename style options
 */
export type RenameStyle = "camelCase" | "kebabCase" | "snakeCase" | "pascalCase";
/**
 * Rename plugin configuration
 */
export interface RenameConfig {
	/**
	 * Target scope for renaming, defaults to 'url'
	 */
	scope?: "url" | "params" | "pathParams" | "data" | "response";
	/**
	 * Matching rule for selective renaming:
	 * - string: target contains this string
	 * - RegExp: target matches this pattern
	 * - function: custom matching logic
	 * If not specified, all targets will be processed
	 */
	match?: string | RegExp | ((key: string) => boolean);
	/**
	 * Naming style to apply
	 */
	style?: RenameStyle;
	/**
	 * Custom transformation function
	 * Will be applied before style transformation
	 */
	transform?: (apiDescriptor: ApiDescriptor) => string;
}
/**
 * Creates a rename plugin that transforms API descriptors
 * according to specified naming rules
 */
export declare function rename(config: RenameConfig | RenameConfig[]): ApiPlugin;
/**
 * Tag modifier handler function type
 * Receives a tag string and returns the modified tag string, or null/undefined/void to remove the tag
 */
export type ModifierHandler = (tag: string) => string | null | undefined | void;
/**
 * Processes tags in the API descriptor
 * @param apiDescriptor The API descriptor
 * @param handler Tag modifier handler function
 * @returns Modified API descriptor
 */
export declare function processApiTags(apiDescriptor: ApiDescriptor, handler: ModifierHandler): ApiDescriptor;
/**
 * Creates a tag modifier plugin
 *
 * @param handler Tag modifier handler function that receives a tag string and returns modified tag or null/undefined/void to remove the tag
 * @returns API plugin instance
 *
 * @example
 * ```ts
 * // Convert all tags to uppercase
 * const upperCasePlugin = tagModifier(tag => tag.toUpperCase());
 *
 * // Add prefix to tags
 * const prefixPlugin = tagModifier(tag => `api-${tag}`);
 *
 * // Remove specific tags
 * const filterPlugin = tagModifier(tag => tag === 'internal' ? null : tag);
 *
 * // Use the plugin
 * export default {
 *   generator: [{
 *     // ...other config
 *     plugins: [upperCasePlugin]
 *   }]
 * };
 * ```
 */
export declare function tagModifier(handler: ModifierHandler): ApiPlugin;
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
