import { cosmiconfig } from 'cosmiconfig';
import path from 'node:path';
import { DEFAULT_CONFIG } from './config';
import { getAlovaJsonPath, readAlovaJson } from './functions/alovaJson';
import { loadJs, loadTs } from './helper/lodaders';
import Configuration from './modules/Configuration';
import type { Config } from './type';

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
export const readAndSaveAlovaJson = (config: Config, projectPath: string = process.cwd()) => {
  const configuration = new Configuration(config, projectPath);
  configuration.getAllOutputPath().forEach(outputPath => {
    // 缓存文件地址
    const alovaJsonPath = getAlovaJsonPath(projectPath, outputPath);
    readAlovaJson(alovaJsonPath).then(data => {
      // 保存templateData
      DEFAULT_CONFIG.templateData.set(alovaJsonPath, data);
    });
  });
};
export default readConfig;
