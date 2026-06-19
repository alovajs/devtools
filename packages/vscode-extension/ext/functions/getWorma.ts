import { existsSync } from 'node:fs'
import path from 'node:path'
import { globSync } from 'glob'
import importFresh from 'import-fresh'
import { disable, enable } from '@/commands/statusBar'
import Error, { AlovaErrorConstructor } from '@/components/error'
import Global from '@/core/Global'
import { Log } from '@/utils'
import { getWorkspacePaths } from '@/utils/vscode'

type Worma = typeof import('worma')
// 用于mock测试
export const MockWorma = {

} as Worma
export function getWorma() {
  let worma: Worma | null = null
  for (const workspaceRootPath of getWorkspacePaths()) {
    if (worma) {
      break
    }
    try {
      const configPaths = globSync('**/worma.config.{js,cjs,mjs,ts,mts,cts}', {
        ignore: 'node_modules/**',
        cwd: workspaceRootPath,
        absolute: true,
      }).concat(path.join(workspaceRootPath, './worma.config.js'))
      for (const configPath of configPaths) {
        const wormaPath = path.join(path.dirname(configPath), './node_modules/worma')
        if (existsSync(wormaPath)) {
          worma = importFresh(wormaPath)
          break
        }
      }
    }
    catch (error) {
      Log.error(error)
    }
  }
  if (worma) {
    enable()
    // Global configuration
    worma.setGlobalConfig({
      Error: AlovaErrorConstructor,
      templateData: Global.templateData,
    })
  }
  else {
    disable()
    Global.deleteConfig()
  }
  return worma
}

export default () =>
  new Proxy(
    {},
    {
      get(_, key: keyof Worma) {
        const worma = getWorma()
        if (MockWorma[key]) {
          return MockWorma[key]
        }
        if (worma) {
          return worma[key]
        }
        return () => {
          Global.deleteConfig()
          throw new Error('module `worma` is not found, please install via `npm i worma`')
        }
      },
    },
  ) as Worma
