import { cosmiconfig } from 'cosmiconfig';
import path from 'node:path';
import { loadJs, loadTs } from './helper/lodaders';
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
export const readConfig = async (projectPath: string) => {
  const searchResult = await alovaExplorer.search(path.resolve(projectPath));
  alovaExplorer.clearCaches();
  if (searchResult?.isEmpty) {
    return null;
  }
  return searchResult?.config as Config | null;
};
export default readConfig;
