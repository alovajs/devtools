import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_CONFIG } from '../config';
import { format } from '../utils';
import type { TemplateData } from './openApi2Data';

export const writeAlovaJson = async (data: TemplateData, originPath: string, name = 'api.json') => {
  // 将数据转换为 JSON 字符串
  let jsonData = '';
  try {
    jsonData = await format(JSON.stringify(data, null, 2), { parser: 'json' });
  } catch (error) {
    console.log(error, 13);
  }
  // 定义 JSON 文件的路径和名称
  const filePath = `${originPath}_${name}`;
  const dirPath = filePath.split(/\/|\\/).slice(0, -1).join('/');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  // 使用 fs.writeFile 将 JSON 数据写入文件
  fs.writeFile(filePath, jsonData, err => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log('JSON file has been saved.');
    }
  });
};
export const readAlovaJson = (originPath: string, name = 'api.json') => {
  // 定义 JSON 文件的路径和名称
  const filePath = `${originPath}_${name}`;
  return new Promise<TemplateData>((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new DEFAULT_CONFIG.Error('alovaJson not exists'));
      return;
    }
    // 使用 fs.readFile 读取 JSON 文件
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        let jsonData = {};
        try {
          jsonData = JSON.parse(data);
        } catch (error) {
          jsonData = {};
        }
        resolve(jsonData as TemplateData);
      }
    });
  });
};
export const getAlovaJsonPath = (workspaceRootDir: string, outputPath: string) =>
  path.join(workspaceRootDir, DEFAULT_CONFIG.alovaTempPath, outputPath.split(/\/|\\/).join('_'));
