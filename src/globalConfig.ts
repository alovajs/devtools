import Error from '@/components/error';
import { getTypescript, log } from '@/utils/work';
import { setGlobalConfig } from '@alova/wormhole';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
// work.js线程路径
export const WORK_PATH = pathToFileURL(path.join(__dirname, '/work.js'));
// 渲染模板路径
// export const TEMPLATE_PATH = path.join(__dirname, '../templates');
// alova临时文件路径
export const ALOVA_TEMP_PATH = path.join('node_modules/.alova');
// 全局配置
setGlobalConfig({
  alovaTempPath: ALOVA_TEMP_PATH,
  log,
  getTypescript,
  Error
});
