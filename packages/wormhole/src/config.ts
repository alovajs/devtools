import path from 'node:path';
import type { TemplateData } from './functions/openApi2Data';

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var ALOVA_WORMHOLE_CONFIG: typeof DEFAULT_CONFIG;
}

const DEFAULT_CONFIG = {
  alovaTempPath: path.join('node_modules/.alova'),
  templatePath: path.join(__dirname, './templates'),
  log: (...messageArr: any[]) => console.log(...messageArr),
  templateData: new Map<string, TemplateData>(),
  Error
};
global.ALOVA_WORMHOLE_CONFIG = DEFAULT_CONFIG;
export function getGlobalConfig() {
  return global.ALOVA_WORMHOLE_CONFIG;
}
export function setGlobalConfig(config: Partial<typeof DEFAULT_CONFIG>) {
  Object.assign(global.ALOVA_WORMHOLE_CONFIG, config);
}
export default { getGlobalConfig, setGlobalConfig };
