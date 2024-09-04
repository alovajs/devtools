/* eslint-disable import/prefer-default-export */
import Error from '@/components/error';
import { getTypescript, log } from '@/utils/work';
import { setGlobalConfig } from '@alova/wormhole';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
// work.js线程路径
export const WORK_PATH = pathToFileURL(path.join(__dirname, '/work.js'));
// 全局配置
setGlobalConfig({
  log,
  getTypescript,
  Error
});
