import type { CacheData } from '@/type/lib'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import esbuild from 'esbuild'
import { readAllCacheApis, readCacheApis } from '@/functions/wormaJson'
import { configHelper, logger } from '@/helper'
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
  // 始终将 worma 自身作为外部依赖，防止 esbuild 打包 worma 源码进入临时文件
  // 否则 __dirname 会指向用户项目目录，导致预设模板路径解析失败
  // monorepo 子包可能不直接依赖 wormajs，但 config 文件会 import from 'wormajs'
  const allExternals = [...new Set([...userDependencies, 'worma', 'wormajs/plugin'])]
  const configTmpFileName = `worma_tmp_${Date.now()}.cjs`
  // 使用绝对路径：esbuild 写入相对 outfile 时按 cwd 解析，
  // 而 require() 解析相对路径时基于调用模块所在目录，二者不一致会导致 require 失败。
  // 绝对路径可保证写入与 require 指向同一文件。
  const outfile = path.resolve(projectPath, configTmpFileName)
  await esbuild.build({
    entryPoints: [configFile],
    // 排除用户已安装的依赖，避免打包进最终文件
    external: allExternals,
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

/**
 * Get cached API docs. Cache is self-describing — no config needed.
 * In monorepo, pass ANY sub-package path; cache is always read from the unified cacheRoot.
 * @param outputs Optional filter: only return entries matching these output paths.
 *                If omitted, returns ALL cached entries (including all monorepo sub-projects).
 * @param projectPath Project root, defaults to `process.cwd()`.
 */
export async function getApiDocs(outputs?: string[], projectPath = process.cwd()): Promise<CacheData[]> {
  if (!projectPath) {
    return []
  }

  if (outputs && outputs.length > 0) {
    const results = await Promise.all(
      outputs.map(o => readCacheApis(projectPath, o)),
    )
    return results.filter((r): r is CacheData => r !== null)
  }

  // No filter: return all (includes all monorepo sub-projects)
  return readAllCacheApis(projectPath)
}
