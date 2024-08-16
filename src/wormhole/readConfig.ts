import { loadJs, loadTs } from '@/helper/lodaders';
import { cosmiconfig } from 'cosmiconfig';
import path from 'node:path';

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
  return searchResult?.config as AlovaConfig | null;
};
export default readConfig;
