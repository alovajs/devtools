import { getGlobalConfig } from '@/config';
import { existsPromise, format } from '@/utils';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { TemplateData } from './openApi2Data';

const DEFAULT_CONFIG = getGlobalConfig();
export const writeAlovaJson = async (data: TemplateData, originPath: string, name = 'api.json') => {
  // 将数据转换为 JSON 字符串
  const jsonData = await format(JSON.stringify(data, null, 2), { parser: 'json' });
  // 定义 JSON 文件的路径和名称
  const filePath = `${originPath}_${name}`;
  const dirPath = filePath.split(/\/|\\/).slice(0, -1).join('/');
  if (!(await existsPromise(dirPath))) {
    await fs.mkdir(dirPath, { recursive: true });
  }
  // 使用 fs.writeFile 将 JSON 数据写入文件
  return fs.writeFile(filePath, jsonData);
};
export const readAlovaJson = async (originPath: string, name = 'api.json') => {
  // 定义 JSON 文件的路径和名称
  const filePath = `${originPath}_${name}`;
  if (!(await existsPromise(filePath))) {
    throw new DEFAULT_CONFIG.Error('alovaJson is not exists');
  }

  // 使用 fs.readFile 读取 JSON 文件
  const data = await fs.readFile(filePath, 'utf8');
  let jsonData = {} as TemplateData;
  try {
    jsonData = JSON.parse(data);
  } catch {
    jsonData = DEFAULT_CONFIG.templateData.get(originPath) ?? jsonData;
  }
  return jsonData;
};
export const getAlovaJsonPath = (workspaceRootDir: string, outputPath: string) =>
  path.join(workspaceRootDir, DEFAULT_CONFIG.alovaTempPath, outputPath.split(/\/|\\/).join('_'));
