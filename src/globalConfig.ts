import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const frameworkName: ['vue', 'react'] = ['vue', 'react'];
// work.js线程路径
export const WORK_PATH = pathToFileURL(path.join(__dirname, '/work.js'));
// 渲染模板路径
export const TEMPLATE_PATH = path.join(__dirname, '../templates');
