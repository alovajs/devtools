import { log } from '@/components/message';
import { getWorkspacePaths } from '@/utils/vscode';
import wormhole from '@/helper/wormhole';
import { removeConfiguration, refeshAutoUpdate } from '@/helper/autoUpdate';
import type { Config } from '@alova/wormhole';
import { CONFIG_POOL } from '@/helper/config';
import Error from '@/components/error';

export const resolveWorkspaces = async (workspaceRootPaths?: string | string[]) => {
  const workspacePaths = workspaceRootPaths ? [workspaceRootPaths].flat() : getWorkspacePaths();
  const dirs = (
    await Promise.allSettled(workspacePaths.map(workspacePath => wormhole.resolveWorkspaces(workspacePath)))
  )
    .filter(item => item.status === 'fulfilled')
    .map(item => item.value)
    .flat();
  return dirs;
};
export default async (workspaceRootPathArr: string | string[]) => {
  let configNum = 0;
  const dirs = await resolveWorkspaces([workspaceRootPathArr].flat());
  for (const dir of dirs) {
    let config: Config | null = null;
    try {
      config = await wormhole.readConfig(dir);
    } catch (err) {
      const error = err as Error;
      if (error.force) {
        throw error;
      }
      log(error.message);
    }
    if (!config) {
      removeConfiguration(dir);
      continue;
    }
    let configuration = CONFIG_POOL.find(([projectPath]) => projectPath === dir);
    if (!configuration) {
      configuration = [dir, config];
      CONFIG_POOL.push(configuration);
    } else {
      configuration[1] = config;
    }
    refeshAutoUpdate(configuration);
    configNum += 1;
  }
  return configNum > 0;
};
export const updatedConfigPool = async () => {
  const workspaceRootPaths = await resolveWorkspaces();
  CONFIG_POOL.filter(([projectPath]) => !workspaceRootPaths.includes(projectPath)).forEach(([projectPath]) =>
    removeConfiguration(projectPath)
  );
};
