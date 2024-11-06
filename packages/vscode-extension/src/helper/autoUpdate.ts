import { highPrecisionInterval } from '@/utils';
import { executeCommand } from '@/utils/vscode';
import wormhole from '@/helper/wormhole';
import { CONFIG_POOL } from '@/helper/config';
import type { ConfigObject } from '@/helper/config';

const AUTOUPDATE_MAP = new Map<
  string,
  { time: number; immediate: boolean; timer: ReturnType<typeof highPrecisionInterval> }
>();

export function refeshAutoUpdate(configuration: ConfigObject) {
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
export function removeConfiguration(dir?: string | string[]) {
  const dirs = dir ? (Array.isArray(dir) ? dir : [dir]) : CONFIG_POOL.map(([dir]) => dir);
  for (const dir of dirs) {
    const idx = CONFIG_POOL.findIndex(([projectPath]) => projectPath === dir);
    if (idx >= 0) {
      // 关闭定时器
      AUTOUPDATE_MAP.get(CONFIG_POOL[idx][0])?.timer?.clear();
      AUTOUPDATE_MAP.delete(CONFIG_POOL[idx][0]);
      CONFIG_POOL.splice(idx, 1);
    }
  }
}
