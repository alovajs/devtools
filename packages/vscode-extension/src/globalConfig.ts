/* eslint-disable import/prefer-default-export */
import { AlovaErrorConstructor } from '@/components/error';
import { log } from '@/utils/work';
import { setGlobalConfig } from '@alova/wormhole';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
// work.js线程路径
export const WORK_PATH = pathToFileURL(path.join(__dirname, '/work.js'));
// 全局配置
setGlobalConfig({
  log,
  Error: AlovaErrorConstructor
});
