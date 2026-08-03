import type { CacheData } from '@/type/lib'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import esbuild from 'esbuild'
import { readAllCacheApis, readCacheApis } from '@/functions/wormaJson'
import { ConfigHelper, logger } from '@/helper'
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
    return config
  }

  // get the dependencies installed by the user
  const userDependencies = await getUserInstalledDependencies(projectPath)
  // always treat worma itself as an external dependency to prevent esbuild from bundling worma source into the temp file
  // otherwise __dirname would point to the user project directory, causing preset template path resolution to fail
  // monorepo sub-packages may not directly depend on wormajs, but the config file imports from 'wormajs'
  const allExternals = [...new Set([...userDependencies, 'worma', 'wormajs/plugin'])]
  const configTmpFileName = `worma_tmp_${Date.now()}.cjs`
  // use an absolute path: esbuild resolves relative outfile against cwd,
  // while require() resolves relative paths against the calling module's directory, and the mismatch would cause require to fail.
  // an absolute path ensures writing and require point to the same file.
  const outfile = path.resolve(projectPath, configTmpFileName)
  await esbuild.build({
    entryPoints: [configFile],
    // exclude dependencies installed by the user to avoid bundling them into the final file
    external: allExternals,
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile,
    logLevel: 'silent',
  })
  // try/finally ensures the temp file is cleaned up in all cases (including require errors)
  let module
  try {
    // eslint-disable-next-line ts/no-require-imports
    module = require(outfile)
  }
  finally {
    await unlink(outfile)
  }
  const config = await ConfigHelper.readUserConfig(module.default || module)
  return config
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
