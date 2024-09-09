import { cosmiconfig } from 'cosmiconfig';
import path from 'node:path';
import type { Config } from '~/index';
import { DEFAULT_CONFIG } from './config';
import { getAlovaJsonPath, readAlovaJson } from './functions/alovaJson';
import { loadJs, loadTs } from './helper/lodaders';
import Configuration from './modules/Configuration';

const alovaExplorer = cosmiconfig('alova', {
  cache: false,
  loaders: {
    '.js': loadJs,
    '.cjs': loadJs,
    '.mjs': loadJs,
    '.ts': loadTs,
    '.mts': loadTs,
    '.cts': loadTs
  }
});
export const readConfig = async (projectPath: string = process.cwd()) => {
  const searchResult = await alovaExplorer.search(path.resolve(projectPath));
  alovaExplorer.clearCaches();
  if (searchResult?.isEmpty) {
    return null;
  }
  const config = searchResult?.config as Config | null;
  if (config) {
    // 缓存文件地址
    readAndSaveAlovaJson(config, projectPath);
  }
  return config;
};
const readAndSaveAlovaJson = (config: Config, projectPath: string = process.cwd()) => {
  const configuration = new Configuration(config, projectPath);
  configuration.getAllOutputPath().forEach(outputPath => {
    // 缓存文件地址
    const alovaJsonPath = getAlovaJsonPath(projectPath, outputPath);
    readAlovaJson(alovaJsonPath)
      .then(data => {
        // 保存templateData
        DEFAULT_CONFIG.templateData.set(alovaJsonPath, data);
      })
      .catch(() => {});
  });
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
export const getApis = (config: Config, projectPath: string = process.cwd()) => {
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
export default readConfig;
