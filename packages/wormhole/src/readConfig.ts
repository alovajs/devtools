import type { Config } from '@/interface.type';
import esbuild from 'esbuild';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_CONFIG } from './config';
import { getAlovaJsonPath } from './functions/alovaJson';
import Configuration from './modules/Configuration';
import { resolveConfigFile } from './utils';

export const readConfig = async (projectPath = process.cwd()) => {
  const configFile = await resolveConfigFile(projectPath);
  if (!configFile) {
    throw new DEFAULT_CONFIG.Error(`Cannot found config file from path ${projectPath}`);
  }
  const configTmpFileName = `alova_tmp_${Date.now()}.js`;
  const outfile = path.join(projectPath, configTmpFileName);
  await esbuild.build({
    entryPoints: [configFile],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile,
    logLevel: 'silent'
  });

  const module = require(outfile);
  const config: Config = module.default || module;
  await unlink(outfile);

  return config;
};

export const getAutoUpdateConfig = (config: Config) => {
  const autoUpdateConfig = config.autoUpdate;
  let time = 60 * 5; // 默认五分钟
  let immediate = false;
  if (typeof autoUpdateConfig === 'object') {
    time = Number(autoUpdateConfig.interval);
    immediate = !!autoUpdateConfig.launchEditor;
  }
  return {
    time,
    immediate
  };
};
export const getApis = (config: Config, projectPath = process.cwd()) => {
  if (!config || !projectPath) {
    return [];
  }
  const configuration = new Configuration(config, projectPath);
  const outputArr = configuration.getAllOutputPath() ?? [];
  return outputArr
    .map(output => {
      const apiPath = getAlovaJsonPath(projectPath, output);
      const templateData = DEFAULT_CONFIG.templateData.get(apiPath);
      if (!templateData) {
        return [];
      }
      return templateData.pathApis.map(item => item.apis);
    })
    .flat(2);
};
