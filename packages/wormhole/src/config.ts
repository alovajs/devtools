declare global {
  // eslint-disable-next-line vars-on-top
  var ALOVA_WORMHOLE_CONFIG: typeof DEFAULT_CONFIG
}

const DEFAULT_CONFIG = {
  cacheDir: '.alova-cache',
  Error,
}
globalThis.ALOVA_WORMHOLE_CONFIG = DEFAULT_CONFIG
export function getGlobalConfig() {
  return globalThis.ALOVA_WORMHOLE_CONFIG
}
export function setGlobalConfig(config: Partial<typeof DEFAULT_CONFIG>) {
  Object.assign(globalThis.ALOVA_WORMHOLE_CONFIG, config)
}
export default { getGlobalConfig, setGlobalConfig }
