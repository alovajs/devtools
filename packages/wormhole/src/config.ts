import type { TemplateData } from '@/type/lib'
import path from 'node:path'

declare global {
  // eslint-disable-next-line vars-on-top
  var ALOVA_WORMHOLE_CONFIG: typeof DEFAULT_CONFIG
}

const DEFAULT_CONFIG = {
  alovaTempPath: path.join('node_modules/.alova'),
  templatePath: path.join(__dirname, './templates'),
  templateData: new Map<string, TemplateData>(),
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
