import type { FormatConfig as OxfmtFormatConfig } from 'oxfmt'
import type { FormatOptions } from '@/helper/config/type'
import { getGlobalConfig } from '@/config'

/**
 * 回退用的真实动态 import。
 * `new Function` 内的 `import()` 不会被 TypeScript 降级为 `require()`，用于 CJS 产物中加载纯 ESM 包。
 */
// eslint-disable-next-line no-new-func -- CJS 产物必须保留 new Function 包裹的真实动态 import，才能加载纯 ESM 的 oxfmt
const fallbackImport = new Function('specifier', 'return import(specifier)') as (
  specifier: string,
) => Promise<typeof import('oxfmt')>

/** oxfmt 只加载一次，后续复用 */
let oxfmtPromise: Promise<typeof import('oxfmt')> | undefined

/**
 * oxfmt 是 ESM-only（`"type": "module"`，无 require 条件），而 worma 的编译产物是 CommonJS。
 *
 * 优先使用字面量 `import()`：vite/vitest 的 SSR 转换器只会识别源码中直接出现的 `import(...)`
 * 并替换为它的 dynamic import 回调，因此测试环境必须走这条路径。
 * 而在 `module: CommonJS` 编译产物中，TypeScript 会把 `import()` 降级为 `require()`，
 * 对纯 ESM 包会抛 `ERR_REQUIRE_ESM`（或 oxfmt 含顶层 await 时抛 `ERR_REQUIRE_ASYNC_MODULE`），
 * 此时回退到 `new Function` 包裹的真实动态 import。
 */
function loadOxfmt(): Promise<typeof import('oxfmt')> {
  oxfmtPromise ??= import('oxfmt').catch(() => fallbackImport('oxfmt'))
  return oxfmtPromise
}

/**
 * 与历史 prettier 配置等价的默认格式化参数。
 * prettier 的 `insertPragma` 在 oxfmt 中不存在（原本即为 false，直接去掉）；
 * `endOfLine: 'auto'` 不为 oxfmt 支持，语义最接近的是 `lf`。
 */
export const defaultFormatOptions: Omit<FormatOptions, 'enabled'> = {
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: true,
  arrowParens: 'avoid',
  singleAttributePerLine: true,
  vueIndentScriptAndStyle: false,
  endOfLine: 'lf',
}

/** 合并 默认 < 用户全局配置 < 本次调用覆盖，并剥掉 worma 自有的 `enabled` 字段 */
function resolveOptions(config?: FormatOptions): OxfmtFormatConfig {
  const { enabled, ...oxfmtOptions } = {
    ...defaultFormatOptions,
    ...(getGlobalConfig().format ?? {}),
    ...(config ?? {}),
  } as FormatOptions
  void enabled
  return oxfmtOptions as OxfmtFormatConfig
}

/**
 * 是否对生成产物执行格式化。由 `format.enabled` 控制，默认 true。
 */
export function isFormatEnabled(): boolean {
  return getGlobalConfig().format?.enabled ?? true
}

/**
 * 格式化一段代码。
 * @param fileName 文件名，oxfmt 依据扩展名推断语言（无 prettier 的 `parser` 选项）
 * @param text 源码文本
 * @param config 单次调用的覆盖配置，优先级最高
 * @returns 格式化后的代码；解析失败时抛错，由调用方回退原文
 */
export async function format(fileName: string, text: string, config?: FormatOptions): Promise<string> {
  const { format: oxfmtFormat } = await loadOxfmt()
  const result = await oxfmtFormat(fileName, text, resolveOptions(config))
  const fatal = result.errors?.find(error => error.severity === 'Error')
  if (fatal) {
    throw new Error(`oxfmt failed to format ${fileName}: ${fatal.message}`)
  }
  return result.code
}
