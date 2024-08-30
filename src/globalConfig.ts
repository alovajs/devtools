import getTypescript from '@/functions/getTypescript';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_CONFIG } from './wormhole';
// work.js线程路径
export const WORK_PATH = pathToFileURL(path.join(__dirname, '/work.js'));
// 渲染模板路径
export const TEMPLATE_PATH = path.join(__dirname, '../templates');
// alova临时文件路径
export const ALOVA_TEMP_PATH = path.join('node_modules/.alova');
DEFAULT_CONFIG.alovaTempPath = ALOVA_TEMP_PATH;
DEFAULT_CONFIG.templatePath = TEMPLATE_PATH;
DEFAULT_CONFIG.getTypescript = getTypescript;
