declare global {
  // eslint-disable-next-line vars-on-top
  var WORMA_CONFIG: typeof DEFAULT_CONFIG
}

const DEFAULT_CONFIG = {
  cacheDir: '.worma-cache',
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
