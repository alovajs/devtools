import { highPrecisionInterval } from '@/utils';
import { log } from '@/components/message';
import { executeCommand, getWorkspacePaths } from '@/utils/vscode';
import wormhole from '@/helper/wormhole';
import type { Config } from '@alova/wormhole';
import { CONFIG_POOL } from '@/helper/config';
import type { ConfigObject } from '@/helper/config';
import Error from '@/components/error';

const AUTOUPDATE_MAP = new Map<
  string,
  { time: number; immediate: boolean; timer: ReturnType<typeof highPrecisionInterval> }
>();

function refeshAutoUpdate(configuration: ConfigObject) {
  const [, config] = configuration;
  const { time, immediate, isStop } = wormhole.getAutoUpdateConfig(config);
  const oldConfig = AUTOUPDATE_MAP.get(configuration[0]);
  // 过滤掉已经配置的定时器
  if (oldConfig?.immediate === immediate && oldConfig?.time === time && oldConfig?.timer?.isRunning()) {
    return;
  }
  if (!isStop) {
    // 设置定时器
    AUTOUPDATE_MAP.set(configuration[0], {
      time,
      immediate,
      timer: highPrecisionInterval(
        () => {
          executeCommand('generateApi', configuration[0]);
        },
        time * 1000,
        immediate
      )
    });
  } else {
    // 移除定时器
    AUTOUPDATE_MAP.delete(configuration[0]);
  }
  // 关闭之前的定时器
  oldConfig?.timer?.clear?.();
}
function removeConfiguration(workspaceRootPath: string) {
  const idx = CONFIG_POOL.findIndex(([projectPath]) => projectPath === workspaceRootPath);
  if (idx >= 0) {
    // 关闭定时器
    AUTOUPDATE_MAP.get(CONFIG_POOL[idx][0])?.timer?.clear();
    AUTOUPDATE_MAP.delete(CONFIG_POOL[idx][0]);
    CONFIG_POOL.splice(idx, 1);
  }
}
export default async (workspaceRootPathArr: string | string[]) => {
  let configNum = 0;
  const workspaceRootPaths = [workspaceRootPathArr].flat();
  for (const workspaceRootPath of workspaceRootPaths) {
    let config: Config | null = null;
    try {
      config = await wormhole.readConfig(workspaceRootPath);
    } catch (err) {
      const error = err as Error;
      if (error.force) {
        throw error;
      }
      log(error.message);
    }
    if (!config) {
      removeConfiguration(workspaceRootPath);
      continue;
    }
    let configuration = CONFIG_POOL.find(([projectPath]) => projectPath === workspaceRootPath);
    if (!configuration) {
      configuration = [workspaceRootPath, config];
      CONFIG_POOL.push(configuration);
    } else {
      configuration[1] = config;
    }
    refeshAutoUpdate(configuration);
    configNum += 1;
  }
  return configNum > 0;
};
export const updatedConfigPool = () => {
  const workspaceRootPaths = getWorkspacePaths();
  CONFIG_POOL.filter(([projectPath]) => !workspaceRootPaths.includes(projectPath)).forEach(([projectPath]) =>
    removeConfiguration(projectPath)
  );
};
