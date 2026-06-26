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
  let wormaRoot: string | undefined
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
          wormaRoot = workspaceRootPath
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
    // Always set cacheRoot to the workspace directory where worma was found.
    // In monorepo this unifies all sub-package caches under the workspace root.
    // In single-package this is the project root itself — a natural no-op.
    worma.setGlobalConfig({
      Error: AlovaErrorConstructor,
      templateData: Global.templateData,
      cacheRoot: wormaRoot,
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
