import { getApis } from '@alova/wormhole';
import path from 'node:path';
import { CONFIG_POOL } from './config';

export default (filePath: string) => {
  const [projectPath, config] = CONFIG_POOL.find(([projectPath]) => filePath.includes(path.resolve(projectPath))) ?? [];
  if (!config) {
    return [];
  }
  return getApis(config, projectPath);
};
