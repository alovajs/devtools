import { Commands } from '@/commands';
import Global from '@/core/Global';
import wormhole from '@/helper/wormhole';
import { highPrecisionInterval } from '@/utils';
import { Config } from '@alova/wormhole';
import { commands } from 'vscode';

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
          commands.executeCommand(Commands.generate_api, path);
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
