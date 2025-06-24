import { configHelper, logger, TemplateHelper } from '@/helper';
import type { Config } from '@/type/lib';
import { resolveConfigFile } from '@/utils';
import esbuild from 'esbuild';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

/**
 * Read the alova.config configuration file and return the parsed configuration object.
 * @param projectPath The project path where the configuration file is located. The default value is `process.cwd()`.
 * @returns a promise instance that contains configuration object.
 */
export const readConfig = async (projectPath = process.cwd()) => {
  const configFile = await resolveConfigFile(projectPath);
  if (!configFile) {
    throw logger.throwError(`Cannot found config file from path ${projectPath}`, {
      projectPath,
      name: 'readConfig'
    });
  }
  const configTmpFileName = `alova_tmp_${Date.now()}.cjs`;
  const outfile = path.join(projectPath, configTmpFileName);
  await esbuild.build({
    entryPoints: [configFile],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile,
    logLevel: 'silent'
  });
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const module = require(outfile);
  unlink(outfile);
  const config: Config = module.default || module;
  // Read the cache file and save it
  await configHelper.load(config, projectPath);
  return config;
};

export const getAutoUpdateConfig = async (config: Config) => {
  await configHelper.load(config);
  return configHelper.autoUpdateConfig();
};

export const getApiDocs = async (config: Config, projectPath = process.cwd()) => {
  if (!config || !projectPath) {
    return [];
  }
  await configHelper.load(config, projectPath);
  return configHelper.getOutput().map(output => {
    const templateData = TemplateHelper.getData(projectPath, output);
    return templateData?.pathApis ?? [];
  });
};
