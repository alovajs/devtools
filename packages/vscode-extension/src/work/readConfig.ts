import { highPrecisionInterval } from '@/utils';
import { executeCommand, log } from '@/utils/work';
import { readConfig, getAutoUpdateConfig, Config } from '@alova/wormhole';
import { CONFIG_POOL } from './config';
import type { ConfigObject } from './config';

const AUTOUPDATE_CONFIG_MAP = new Map<ConfigObject, { time: number; immediate: boolean }>();
const AUTOUPDATE_MAP = new Map<ConfigObject, ReturnType<typeof highPrecisionInterval>>();

function refeshAutoUpdate(configuration: ConfigObject) {
  const [, config] = configuration;
  const { time, immediate } = getAutoUpdateConfig(config);
  const oldConfig = AUTOUPDATE_CONFIG_MAP.get(configuration);
  const oldTimer = AUTOUPDATE_MAP.get(configuration);
  // 过滤掉已经配置的定时器
  if (oldConfig?.immediate === immediate && oldConfig.time === time && oldTimer?.isRunning()) {
    return;
  }
  oldTimer?.clear();
  AUTOUPDATE_CONFIG_MAP.set(configuration, { immediate, time });
  AUTOUPDATE_MAP.set(
    configuration,
    highPrecisionInterval(
      () => {
        executeCommand('generateApi', configuration[0]);
      },
      time * 1000,
      immediate
    )
  );
}
function removeConfiguration(workspaceRootPath: string) {
  const idx = CONFIG_POOL.findIndex(([projectPath]) => projectPath === workspaceRootPath);
  if (idx >= 0) {
    AUTOUPDATE_MAP.get(CONFIG_POOL[idx])?.clear();
    AUTOUPDATE_MAP.delete(CONFIG_POOL[idx]);
    AUTOUPDATE_CONFIG_MAP.delete(CONFIG_POOL[idx]);
    CONFIG_POOL.splice(idx, 1);
  }
}
export default async (workspaceRootPathArr: string[]) => {
  let configNum = 0;
  for (const workspaceRootPath of workspaceRootPathArr) {
    let config: Config | null = null;
    try {
      config = await readConfig(workspaceRootPath);
    } catch (error: any) {
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
