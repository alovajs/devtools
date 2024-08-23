import { TEMPLATE_DATA } from '@/wormhole/modules/TemplateFile';
import path from 'node:path';

export const DEFAULT_CONFIG = {
  alovaTempPath: path.join('node_modules/.alova'),
  templatePath: path.join(__dirname, '../../templates'),
  getTypescript: async () => {
    let ts: typeof import('typescript') | null = null;
    try {
      ts = (await import('typescript')).default;
    } catch (error) {}
    return ts;
  },
  templateData: TEMPLATE_DATA
};
export default { DEFAULT_CONFIG };
