// ============================================================
// 枚举常量定义 — 统一管理项目中所有硬编码的字符串/数字常量
// ============================================================

/** 模板代码生成类型 */
export enum TemplateTypeEnum {
  TYPESCRIPT = 'typescript',
  MODULE = 'module',
  COMMONJS = 'commonjs',
}

/** 配置中的 type 字段值（比 TemplateTypeEnum 多了 auto/ts 选项） */
export enum ConfigTypeEnum {
  AUTO = 'auto',
  TS = 'ts',
  TYPESCRIPT = 'typescript',
  MODULE = 'module',
  COMMONJS = 'commonjs',
}

/** 支持的 OpenAPI 平台 */
export enum PlatformTypeEnum {
  SWAGGER = 'swagger',
  KNIFE4J = 'knife4j',
  FASTAPI = 'fastapi',
  YAPI = 'yapi',
}

/** 模块体系类型 */
export enum ModuleKind {
  ES_MODULE = 'ESModule',
  COMMON_JS = 'commonJs',
}

/** 前端框架名称 */
export enum FrameworkName {
  VUE = 'vue',
  REACT = 'react',
  SVELTE = 'svelte',
  SOLID_JS = 'solid-js',
  NUXT = 'nuxt',
}

/** 模板文件扩展名 */
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

/** Handlebars 模板文件扩展名列表（不含普通 ts/js 扩展） */
export const TEMPLATE_EXTENSIONS = Object.values(FileExtension)

/** OpenAPI 参数位置 */
export enum ParameterIn {
  QUERY = 'query',
  PATH = 'path',
  HEADER = 'header',
  COOKIE = 'cookie',
}

/** 重命名的 scope 类型 */
export enum RenameScope {
  URL = 'url',
  PARAMS = 'params',
  PATH_PARAMS = 'pathParams',
  DATA = 'data',
  RESPONSE = 'response',
  REF_NAME = 'refName',
  NAME = 'name',
}

/** 过滤 scope 类型 */
export enum FilterScope {
  URL = 'url',
  TAG = 'tag',
}

/** 内建插件名称 */
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

/** 模板占位符 */
export enum TemplatePlaceholder {
  TAG = '{tag}',
  API = '{api}',
}

/** 模板扫描时跳过的目录 */
export enum TemplateSkipDir {
  PARTIALS = 'partials',
  TAG_DIR = '{tag}',
}

/** 预设模板名称 */
export enum PresetTemplateName {
  ALOVA = 'alova',
  AXIOS = 'axios',
  FETCH = 'fetch',
  KY = 'ky',
  GLOBALS = 'alova-globals',
  CONFIG = 'config',
  AI_DOC = 'ai-doc',
}

/** 模板目录名（与 config.type 不同：commonjs -> common） */
export enum ModuleTypeDir {
  TYPESCRIPT = 'typescript',
  MODULE = 'module',
  COMMON = 'common',
}

/** 模块类型目录名数组 */
export const MODULE_TYPE_DIRS = [ModuleTypeDir.TYPESCRIPT, ModuleTypeDir.MODULE, ModuleTypeDir.COMMON] as const
export type ModuleTypeKey = (typeof MODULE_TYPE_DIRS)[number]

/** 模块类型 -> ModuleKind 映射 */
export const MODULE_TYPE_TO_KIND: Record<string, ModuleKind> = {
  [TemplateTypeEnum.TYPESCRIPT]: ModuleKind.ES_MODULE,
  [TemplateTypeEnum.MODULE]: ModuleKind.ES_MODULE,
  [TemplateTypeEnum.COMMONJS]: ModuleKind.COMMON_JS,
}

/** 文件扩展名 -> 输出文件名映射 */
export function getTypeFileExtension(type: TemplateTypeEnum | string): string {
  return type === TemplateTypeEnum.TYPESCRIPT ? FileExtension.TS : FileExtension.JS
}

/** 框架名称列表 */
export const FRAMEWORK_NAMES: string[] = [
  FrameworkName.VUE,
  FrameworkName.REACT,
  FrameworkName.SVELTE,
  FrameworkName.SOLID_JS,
  FrameworkName.NUXT,
]
