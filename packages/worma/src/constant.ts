// ============================================================
// Enumeration constant definitions — centrally manage all hardcoded string/number constants in the project
// ============================================================

/** Template code generation type */
export enum TemplateTypeEnum {
  TYPESCRIPT = 'typescript',
  MODULE = 'module',
  COMMONJS = 'commonjs',
}

/** The type field value in config (adds auto/ts options over TemplateTypeEnum) */
export enum ConfigTypeEnum {
  AUTO = 'auto',
  TS = 'ts',
  TYPESCRIPT = 'typescript',
  MODULE = 'module',
  COMMONJS = 'commonjs',
}

/** Supported OpenAPI platforms */
export enum PlatformTypeEnum {
  SWAGGER = 'swagger',
  KNIFE4J = 'knife4j',
  FASTAPI = 'fastapi',
  YAPI = 'yapi',
}

/** Module system type */
export enum ModuleKind {
  ES_MODULE = 'ESModule',
  COMMON_JS = 'commonJs',
}

/** Frontend framework names */
export enum FrameworkName {
  VUE = 'vue',
  REACT = 'react',
  SVELTE = 'svelte',
  SOLID_JS = 'solid-js',
  NUXT = 'nuxt',
}

/** Template file extensions */
export enum FileExtension {
  HBS = '.hbs',
  HANDLEBARS = '.handlebars',
  TS = '.ts',
  TSX = '.tsx',
  JS = '.js',
  JSX = '.jsx',
  MJS = '.mjs',
  CJS = '.cjs',
  D_TS = '.d.ts',
  D_CTS = '.d.cts',
  D_MTS = '.d.mts',
}

/** List of Handlebars template file extensions (excluding plain ts/js extensions) */
export const TEMPLATE_EXTENSIONS = Object.values(FileExtension)

/** OpenAPI parameter locations */
export enum ParameterIn {
  QUERY = 'query',
  PATH = 'path',
  HEADER = 'header',
  COOKIE = 'cookie',
}

/** Rename scope types */
export enum RenameScope {
  URL = 'url',
  PARAMS = 'params',
  PATH_PARAMS = 'pathParams',
  DATA = 'data',
  RESPONSE = 'response',
  REF_NAME = 'refName',
  NAME = 'name',
}

/** Filter scope types */
export enum FilterScope {
  URL = 'url',
  TAG = 'tag',
}

/** Built-in plugin names */
export enum PluginName {
  TAG_MODIFIER = 'tagModifier',
  FILTER_API = 'filterApi',
  RENAME = 'rename',
  PAYLOAD_MODIFIER = 'payloadModifier',
  IMPORT_TYPE = 'importType',
  AI_DOC = 'aiDoc',
  APIFOX = 'apifox',
  SWAGGER = 'swagger',
  KNIFE4J = 'knife4j',
  FASTAPI = 'fastapi',
  YAPI = 'yapi',
  TEMPLATE_ALOVA = 'templateAlova',
  TEMPLATE_ALOVA_GLOBALS = 'templateAlovaGlobals',
  TEMPLATE_AXIOS = 'templateAxios',
  TEMPLATE_FETCH = 'templateFetch',
  TEMPLATE_KY = 'templateKy',
  TEMPLATE_CONFIG = 'templateConfig',
}

/** Template placeholders */
export enum TemplatePlaceholder {
  TAG = '{tag}',
  API = '{api}',
}

/** Directories skipped during template scanning */
export enum TemplateSkipDir {
  PARTIALS = 'partials',
  TAG_DIR = '{tag}',
}

/** Preset template names */
export enum PresetTemplateName {
  ALOVA = 'alova',
  AXIOS = 'axios',
  FETCH = 'fetch',
  KY = 'ky',
  GLOBALS = 'alova-globals',
  CONFIG = 'config',
  AI_DOC = 'ai-doc',
}

/** Template directory name (differs from config.type: commonjs -> common) */
export enum ModuleTypeDir {
  TYPESCRIPT = 'typescript',
  MODULE = 'module',
  COMMON = 'common',
}

/** Array of module-type directory names */
export const MODULE_TYPE_DIRS = [ModuleTypeDir.TYPESCRIPT, ModuleTypeDir.MODULE, ModuleTypeDir.COMMON] as const
export type ModuleTypeKey = (typeof MODULE_TYPE_DIRS)[number]

/** Module type -> ModuleKind mapping */
export const MODULE_TYPE_TO_KIND: Record<string, ModuleKind> = {
  [TemplateTypeEnum.TYPESCRIPT]: ModuleKind.ES_MODULE,
  [TemplateTypeEnum.MODULE]: ModuleKind.ES_MODULE,
  [TemplateTypeEnum.COMMONJS]: ModuleKind.COMMON_JS,
}

/** File extension -> output file name mapping */
export function getTypeFileExtension(type: TemplateTypeEnum | string): string {
  return type === TemplateTypeEnum.TYPESCRIPT ? FileExtension.TS : FileExtension.JS
}

/** Framework name list */
export const FRAMEWORK_NAMES: string[] = [
  FrameworkName.VUE,
  FrameworkName.REACT,
  FrameworkName.SVELTE,
  FrameworkName.SOLID_JS,
  FrameworkName.NUXT,
]
