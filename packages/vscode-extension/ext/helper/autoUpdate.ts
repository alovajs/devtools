import type { Config } from 'worma'
import { commands, workspace } from 'vscode'
import { Commands } from '@/commands'
import Global from '@/core/Global'
import { highPrecisionInterval } from '@/utils'

interface AutoUpdateConfig {
  isStop: boolean
  immediate: boolean
  time: number
}

function getAutoUpdateConfig(): AutoUpdateConfig {
  const raw = workspace.getConfiguration().get<boolean | { launchEditor?: boolean, interval?: number }>('worma.autoUpdate', true)
  if (raw === false) {
    return { isStop: true, immediate: false, time: 300000 }
  }
  if (raw === true || raw == null) {
    return { isStop: false, immediate: false, time: 300000 }
  }
  return {
    isStop: false,
    immediate: raw.launchEditor ?? false,
    time: raw.interval ?? 300000,
  }
}

export async function refeshAutoUpdate(path: string, _config: Config) {
  const { time, immediate, isStop } = getAutoUpdateConfig()
  const timer = Global.getTimer(path)
  if (timer?.immediate === immediate && timer?.time === time && timer?.isRunning()) {
    return
  }
  if (!isStop) {
    Global.setTimer(
      path,
      highPrecisionInterval(
        () => {
          commands.executeCommand(Commands.generate_api, path)
        },
        time,
        immediate,
      ),
    )
  }
  else {
    Global.deleteTimer(path)
  }
}
export default {
  refeshAutoUpdate,
}
