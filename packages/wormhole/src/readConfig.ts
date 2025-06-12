import { configHelper } from '@/infrastructure/config/ConfigHelper';
import { logger } from '@/infrastructure/logger';
import type { Config } from '@/interface.type';
import esbuild from 'esbuild';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { getGlobalConfig } from './config';
import { getAlovaJsonPath } from './functions/alovaJson';
import { resolveConfigFile } from './utils';

const DEFAULT_CONFIG = getGlobalConfig();

/**
 * Read the alova.config configuration file and return the parsed configuration object.
 * @param projectPath The project path where the configuration file is located. The default value is `process.cwd()`.
 * @returns a promise instance that contains configuration object.
 */
export const readConfig = async (projectPath = process.cwd()) => {
  const configFile = await resolveConfigFile(projectPath);
  if (!configFile) {
    throw logger.error(`Cannot found config file from path ${projectPath}`, {
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
export const getApis = async (config: Config, projectPath = process.cwd()) => {
  if (!config || !projectPath) {
    return [];
  }
  await configHelper.load(config, projectPath);
  return configHelper.getOutput().flatMap(output => {
    const apiPath = getAlovaJsonPath(projectPath, output);
    const templateData = DEFAULT_CONFIG.templateData.get(apiPath);
    if (!templateData) {
      return [];
    }
    return templateData.pathApis.flatMap(item => item.apis);
  });
};

export const getApiDocs = async (config: Config, projectPath = process.cwd()) => {
  if (!config || !projectPath) {
    return [];
  }
  await configHelper.load(config, projectPath);
  return configHelper.getOutput().map(output => {
    const apiPath = getAlovaJsonPath(projectPath, output);
    const templateData = DEFAULT_CONFIG.templateData.get(apiPath);
    return templateData?.pathApis ?? [];
  });
};
