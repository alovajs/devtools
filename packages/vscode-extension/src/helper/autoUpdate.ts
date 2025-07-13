import Global from '@/core/Global';
import wormhole from '@/helper/wormhole';
import { highPrecisionInterval } from '@/utils';
import { executeCommand } from '@/utils/vscode';
import { Config } from '@alova/wormhole';

export async function refeshAutoUpdate(path: string, config: Config) {
  const { time, immediate, isStop } = await wormhole.getAutoUpdateConfig(config);
  const timer = Global.getTimer(path);
  const timerTime = time * 1000;
  if (timer?.immediate === immediate && timer?.time === timerTime && timer?.isRunning()) {
    return;
  }
  if (!isStop) {
    // Set timer
    Global.setTimer(
      path,
      highPrecisionInterval(
        () => {
          executeCommand('generateApi', path);
        },
        timerTime,
        immediate
      )
    );
  } else {
    // Remove timer
    Global.deleteTimer(path);
  }
}
export default {
  refeshAutoUpdate
};
