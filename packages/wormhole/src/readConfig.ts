import type { Config } from '@/type/config';
import esbuild from 'esbuild';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { getGlobalConfig } from './config';
import { getAlovaJsonPath } from './functions/alovaJson';
import Configuration from './modules/Configuration';
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
    throw new DEFAULT_CONFIG.Error(`Cannot found config file from path ${projectPath}`);
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

  const config: Config = module.default || module;
  await unlink(outfile);
  // Read the cache file and save it
  const configuration = new Configuration(config, projectPath);
  configuration.readAlovaJson();
  return config;
};

export const getAutoUpdateConfig = (config: Config) => {
  const autoUpdateConfig = config.autoUpdate;
  let time = 60 * 5; // Default five minutes

  let immediate = false;
  const isStop = !autoUpdateConfig;
  if (typeof autoUpdateConfig === 'object') {
    time = Number(autoUpdateConfig.interval);
    immediate = !!autoUpdateConfig.launchEditor;
  }
  return {
    time,
    isStop,
    immediate
  };
};
export const getApis = (config: Config, projectPath = process.cwd()) => {
  if (!config || !projectPath) {
    return [];
  }
  const configuration = new Configuration(config, projectPath);
  const outputArr = configuration.getAllOutputPath() ?? [];
  return outputArr.flatMap(output => {
    const apiPath = getAlovaJsonPath(projectPath, output);
    const templateData = DEFAULT_CONFIG.templateData.get(apiPath);
    if (!templateData) {
      return [];
    }
    return templateData.pathApis.flatMap(item => item.apis);
  });
};
