import type { Config } from '@alova/wormhole'
import type Error from '@/components/error'
import Global from '@/core/Global'
import { refeshAutoUpdate } from '@/helper/autoUpdate'
import wormhole from '@/helper/wormhole'
import { getWorkspacePaths } from '@/utils/vscode'

async function resolveWorkspaces(workspaceRootPaths?: string | string[]) {
  const workspacePaths = workspaceRootPaths ? [workspaceRootPaths].flat() : getWorkspacePaths()
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
  Global.emitConfigChange()
  return { configNum, errorArr }
}
