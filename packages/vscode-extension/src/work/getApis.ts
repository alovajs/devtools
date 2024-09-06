import { DEFAULT_CONFIG, getAlovaJsonPath } from '@alova/wormhole';
import path from 'node:path';
import { CONFIG_POOL } from './config';

export default (filePath: string) => {
  const config = CONFIG_POOL.find(item => filePath.includes(path.resolve(item.workspaceRootDir)));
  if (!config) {
    return [];
  }
  const outputArr = config?.getAllOutputPath() || [];
  return outputArr
    .map(output => {
      const apiPath = getAlovaJsonPath(config.workspaceRootDir, output);
      const templateData = DEFAULT_CONFIG.templateData.get(apiPath);
      if (!templateData) {
        return [];
      }
      return templateData.pathApis.map(item => item.apis);
    })
    .flat(2);
};
