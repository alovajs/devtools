import generateApi from '@/commands/generateApi';
import { CONFIG_POOL } from '@/helper/configuration';
import { highPrecisionInterval } from '@/utils';
import { readConfig } from '@/wormhole';
import Configuration from '@/wormhole/modules/Configuration';
import * as vscode from 'vscode';

const AUTOUPDATE_CONFIG_MAP = new Map<Configuration, ReturnType<Configuration['getAutoUpdateConfig']>>();
const AUTOUPDATE_MAP = new Map<Configuration, ReturnType<typeof highPrecisionInterval>>();
function refeshAutoUpdate(configuration: Configuration) {
  const { time, immediate } = configuration.getAutoUpdateConfig();
  const oldConfig = AUTOUPDATE_CONFIG_MAP.get(configuration);
  const oldTimer = AUTOUPDATE_MAP.get(configuration);
  // 过滤掉已经配置的定时器
  if (oldConfig?.immediate === immediate && oldConfig.time === time && oldTimer?.isRunning()) {
    return;
  }
  oldTimer?.clear();
  AUTOUPDATE_MAP.set(
    configuration,
    highPrecisionInterval(
      () => {
        vscode.commands.executeCommand(generateApi.commandId);
      },
      time * 1000,
      immediate
    )
  );
}
function removeConfiguration(workspaceRootPath: string) {
  const idx = CONFIG_POOL.findIndex(item => item.workspaceRootDir === workspaceRootPath);
  if (idx >= 0) {
    AUTOUPDATE_MAP.get(CONFIG_POOL[idx])?.clear();
    AUTOUPDATE_MAP.delete(CONFIG_POOL[idx]);
    AUTOUPDATE_CONFIG_MAP.delete(CONFIG_POOL[idx]);
    CONFIG_POOL.splice(idx, 1);
  }
}
export default async (workspaceRootPath: string) => {
  const config = await readConfig(workspaceRootPath);
  if (!config) {
    removeConfiguration(workspaceRootPath);
    return;
  }
  let configuration = CONFIG_POOL.find(item => item.workspaceRootDir === workspaceRootPath);
  if (!configuration) {
    configuration = new Configuration(config, workspaceRootPath);
    CONFIG_POOL.push(configuration);
  } else {
    configuration.config = config;
  }
  refeshAutoUpdate(configuration);
};
