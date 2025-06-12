import { CONFIG_POOL } from '@/helper/config';
import wormhole from '@/helper/wormhole';
import { getFileNameByPath } from '@/utils';
import path from 'node:path';

export default async (filePath: string) => {
  const [projectPath, config] = CONFIG_POOL.find(([projectPath]) => filePath.includes(path.resolve(projectPath))) ?? [];
  if (!config) {
    return [];
  }
  const apiDocs = await wormhole.getApiDocs(config, projectPath);
  return apiDocs.flatMap(apiDoc => apiDoc.flatMap(item => item.apis));
};
export const getApiDocs = async () =>
  Promise.all(
    CONFIG_POOL.map(async ([projectPath, config]) => ({
      name: getFileNameByPath(projectPath),
      apiDocs: await wormhole.getApiDocs(config, projectPath)
    }))
  );
