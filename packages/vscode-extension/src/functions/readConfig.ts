import Error from '@/components/error';
import { refeshAutoUpdate, removeConfiguration } from '@/helper/autoUpdate';
import { CONFIG_POOL, ON_CONFIG_CHANGE } from '@/helper/config';
import wormhole from '@/helper/wormhole';
import { getWorkspacePaths } from '@/utils/vscode';
import type { Config } from '@alova/wormhole';

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
  const errorArr: Array<Error> = [];
  const dirs = await resolveWorkspaces([workspaceRootPathArr].flat());
  for (const dir of dirs) {
    let config: Config | null = null;
    try {
      config = await wormhole.readConfig(dir);
    } catch (err) {
      const error = err as Error;
      error?.setPath?.(dir);
      errorArr.push(error);
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
  ON_CONFIG_CHANGE.forEach(fn => fn());
  ON_CONFIG_CHANGE.splice(0, ON_CONFIG_CHANGE.length);
  return { configNum, errorArr };
};
export const updatedConfigPool = async () => {
  const workspaceRootPaths = await resolveWorkspaces();
  CONFIG_POOL.filter(([projectPath]) => !workspaceRootPaths.includes(projectPath)).forEach(([projectPath]) =>
    removeConfiguration(projectPath)
  );
};
