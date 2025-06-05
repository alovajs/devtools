import { CONFIG_POOL } from '@/helper/config';
import wormhole from '@/helper/wormhole';
import { getFileNameByPath } from '@/utils';
import path from 'node:path';

export default (filePath: string) => {
  const [projectPath, config] = CONFIG_POOL.find(([projectPath]) => filePath.includes(path.resolve(projectPath))) ?? [];
  if (!config) {
    return [];
  }
  return wormhole.getApis(config, projectPath);
};
export const getApiDocs = () =>
  CONFIG_POOL.map(([projectPath, config]) => ({
    name: getFileNameByPath(projectPath),
    apiDocs: wormhole.getApiDocs(config, projectPath)
  }));
