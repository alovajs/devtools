import { getApis } from '@/helper/wormhole';
import path from 'node:path';
import { CONFIG_POOL } from '@/helper/config';

export default (filePath: string) => {
  const [projectPath, config] = CONFIG_POOL.find(([projectPath]) => filePath.includes(path.resolve(projectPath))) ?? [];
  if (!config) {
    return [];
  }
  return getApis(config, projectPath);
};
