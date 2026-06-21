import type { CacheData, Config } from '@/type/lib'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import esbuild from 'esbuild'
import { configHelper, logger, TemplateHelper } from '@/helper'
import { getUserInstalledDependencies, resolveConfigFile } from '@/utils'
import { readWormaRc } from './functions/readWormaRc'
/**
 * Read the worma.config configuration file and return the parsed configuration object.
 * @param projectPath The project path where the configuration file is located. The default value is `process.cwd()`.
 * @returns a promise instance that contains configuration object.
 */
export async function readConfig(projectPath = process.cwd()) {
  const configFile = await resolveConfigFile(projectPath)
  if (!configFile) {
    throw logger.throwError(`Cannot found config file from path ${projectPath}`, {
      projectPath,
      name: 'readConfig',
    })
  }

  // Check if it's a .wormarc file
  if (configFile.endsWith('.wormarc')) {
    const config = await readWormaRc(projectPath)
    if (!config) {
      throw logger.throwError(`Failed to parse .wormarc file from path ${projectPath}`, {
        projectPath,
        name: 'readConfig',
      })
    }
    await configHelper.load(config, projectPath)
    return config
  }

  // 获取用户已安装的依赖
  const userDependencies = await getUserInstalledDependencies(projectPath)
  const configTmpFileName = `alova_tmp_${Date.now()}.cjs`
  // 使用绝对路径：esbuild 写入相对 outfile 时按 cwd 解析，
  // 而 require() 解析相对路径时基于调用模块所在目录，二者不一致会导致 require 失败。
  // 绝对路径可保证写入与 require 指向同一文件。
  const outfile = path.resolve(projectPath, configTmpFileName)
  await esbuild.build({
    entryPoints: [configFile],
    // 排除用户已安装的依赖，避免打包进最终文件
    external: [...userDependencies],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile,
    logLevel: 'silent',
  })
  // try/finally 保证临时文件在任何情况下（require 抛错）都被清理
  let module
  try {
    // eslint-disable-next-line ts/no-require-imports
    module = require(outfile)
  }
  finally {
    await unlink(outfile)
  }
  const config = await configHelper.readUserConfig(module.default || module)
  // Read the cache file and save it
  await configHelper.load(config, projectPath)
  return configHelper.getConfig()
}

export async function getApiDocs(config: Config, projectPath = process.cwd()): Promise<CacheData[]> {
  if (!config || !projectPath) {
    return []
  }
  await configHelper.load(config, projectPath)
  return configHelper.getOutput().map((output) => {
    const cacheData = TemplateHelper.getData(projectPath, output!)
    return cacheData ?? { path: output!, apis: [] }
  })
}
