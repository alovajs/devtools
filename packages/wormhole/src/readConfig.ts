import type { Config } from '@/type/lib'
import { unlink } from 'node:fs/promises'
import path from 'node:path'
import esbuild from 'esbuild'
import { configHelper, logger, TemplateHelper } from '@/helper'
import { getUserInstalledDependencies, resolveConfigFile } from '@/utils'
/**
 * Read the alova.config configuration file and return the parsed configuration object.
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
  // 获取用户已安装的依赖
  const userDependencies = getUserInstalledDependencies(projectPath)
  const configTmpFileName = `alova_tmp_${Date.now()}.cjs`
  const outfile = path.join(projectPath, configTmpFileName)
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
  // eslint-disable-next-line ts/no-require-imports
  const module = require(outfile)
  unlink(outfile)
  const config = await configHelper.readUserConfig(module.default || module)
  // Read the cache file and save it
  await configHelper.load(config, projectPath)
  return config
}

export async function getAutoUpdateConfig(config: Config) {
  await configHelper.load(config)
  return configHelper.autoUpdateConfig()
}

export async function getApiDocs(config: Config, projectPath = process.cwd()) {
  if (!config || !projectPath) {
    return []
  }
  await configHelper.load(config, projectPath)
  return configHelper.getOutput().map((output) => {
    const templateData = TemplateHelper.getData(projectPath, output)
    return templateData?.pathApis ?? []
  })
}
