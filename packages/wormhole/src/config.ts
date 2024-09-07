import path from 'node:path';
import type { TemplateData } from './functions/openApi2Data';

export const TEMPLATE_DATA = new Map<string, TemplateData>();
export const DEFAULT_CONFIG = {
  alovaTempPath: path.join('node_modules/.alova'),
  templatePath: path.join(__dirname, './templates'),
  log: (...messageArr: any[]) => console.log(...messageArr),
  getTypescript: async () => {
    let ts: typeof import('typescript') | null = null;
    try {
      ts = (await import('typescript')).default;
    } catch (error) {}
    return ts;
  },
  templateData: TEMPLATE_DATA,
  Error: class extends Error {}
};
export function setGlobalConfig(config: Partial<typeof DEFAULT_CONFIG>) {
  Object.assign(DEFAULT_CONFIG, config);
}
export default { DEFAULT_CONFIG, setGlobalConfig };
