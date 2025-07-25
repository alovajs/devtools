import type { Config } from '@alova/wormhole'
import type Error from '@/components/error'
import Global from '@/core/Global'
import { refeshAutoUpdate } from '@/helper/autoUpdate'
import wormhole from '@/helper/wormhole'
import { Log } from '@/utils'
import { getWorkspacePaths } from '@/utils/vscode'

async function resolveWorkspaces(workspaceRootPaths?: string | string[]) {
  Log.info(`🏍${workspaceRootPaths}`)
  const workspacePaths = workspaceRootPaths ? [workspaceRootPaths].flat() : getWorkspacePaths()
  Log.info(`workspacePaths：${workspacePaths.join('\n')}`)
  const dirs = (
    await Promise.allSettled(workspacePaths.map(workspacePath => wormhole.resolveWorkspaces(workspacePath)))
  )
    .filter(item => item.status === 'fulfilled')
    .map(item => item.value)
    .flat()
  return dirs
}
export default async (workspaceRootPathArr?: string | string[]) => {
  let configNum = 0
  const errorArr: Array<Error> = []
  const dirs = await resolveWorkspaces(workspaceRootPathArr)
  Log.info(dirs.join('\n'))
  for (const dir of dirs) {
    let config: Config | null = null
    try {
      config = await wormhole.readConfig(dir)
    }
    catch (err) {
      const error = err as Error
      error?.setPath?.(dir)
      errorArr.push(error)
    }
    if (!config) {
      Global.deleteConfig(dir)
      continue
    }
    Global.setConfig(dir, config)
    refeshAutoUpdate(dir, config)
    configNum += 1
  }
  Log.info(`🚚${Global.getConfigs().map(item => item[0]).join('\n')}`)
  Global.emitConfigChange()
  return { configNum, errorArr }
}
