import type { FormatOptions } from '@/helper/config/type'

declare global {
  // eslint-disable-next-line vars-on-top
  var WORMA_CONFIG: typeof DEFAULT_CONFIG
}

const DEFAULT_CONFIG = {
  cacheDir: '.worma-cache',
  /** Overrides cacheDir's parent directory for monorepo unified cache. */
  cacheRoot: undefined as string | undefined,
  /**
   * Maximum number of `changes/<NNNN>.json` records to keep.
   * `0` (or any non-positive value) keeps every record.
   */
  changeHistoryLimit: 100,
  /** 用户自定义的产物格式化配置，未设置时使用内置默认值 */
  format: undefined as FormatOptions | undefined,
  Error,
  templateData: new Map<string, any>(),
}
globalThis.WORMA_CONFIG = DEFAULT_CONFIG
export function getGlobalConfig() {
  return globalThis.WORMA_CONFIG
}
export function setGlobalConfig(config: Partial<typeof DEFAULT_CONFIG>) {
  Object.assign(globalThis.WORMA_CONFIG, config)
}
export default { getGlobalConfig, setGlobalConfig }
