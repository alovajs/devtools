import { existsSync } from 'node:fs'
import path from 'node:path'
import { globSync } from 'glob'
import importFresh from 'import-fresh'
import { disable, enable } from '@/commands/statusBar'
import Error, { AlovaErrorConstructor } from '@/components/error'
import Global from '@/core/Global'
import { Log } from '@/utils'
import { getWorkspacePaths } from '@/utils/vscode'

type Wormhole = typeof import('@alova/wormhole')
// 用于mock测试
export const MockWormhole = {

} as Wormhole
export function getWormhole() {
  let wormhole: Wormhole | null = null
  for (const workspaceRootPath of getWorkspacePaths()) {
    if (wormhole) {
      break
    }
    try {
      const configPaths = globSync('**/alova.config.{js,cjs,mjs,ts,mts,cts}', {
        ignore: 'node_modules/**',
        cwd: workspaceRootPath,
        absolute: true,
      }).concat(path.join(workspaceRootPath, './alova.config.js'))
      for (const configPath of configPaths) {
        const wormholePath = path.join(path.dirname(configPath), './node_modules/@alova/wormhole')
        if (existsSync(wormholePath)) {
          wormhole = importFresh(wormholePath)
          break
        }
      }
    }
    catch (error) {
      Log.error(error)
    }
  }
  if (wormhole) {
    enable()
    // Global configuration
    wormhole.setGlobalConfig({
      Error: AlovaErrorConstructor,
      templateData: Global.templateData,
    })
  }
  else {
    disable()
    Global.deleteConfig()
  }
  return wormhole
}

export default () =>
  new Proxy(
    {},
    {
      get(_, key: keyof Wormhole) {
        const wormhole = getWormhole()
        if (MockWormhole[key]) {
          return MockWormhole[key]
        }
        if (wormhole) {
          return wormhole[key]
        }
        return () => {
          Global.deleteConfig()
          throw new Error('module `@alova/wormhole` is not found, please install via `npm i @alova/wormhole`')
        }
      },
    },
  ) as Wormhole
