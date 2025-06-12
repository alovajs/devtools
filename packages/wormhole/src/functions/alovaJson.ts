import { getGlobalConfig } from '@/config';
import { logger } from '@/infrastructure/logger';
import type { TemplateData } from '@/interface.type';
import { existsPromise, format } from '@/utils';
import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_CONFIG = getGlobalConfig();
export const writeAlovaJson = async (data: TemplateData, originPath: string, name = 'api.json') => {
  // Convert data to JSON string

  const jsonData = await format(JSON.stringify(data, null, 2), { parser: 'json' });
  // Define the path and name of the JSON file

  const filePath = `${originPath}_${name}`;
  const dirPath = filePath.split(/\/|\\/).slice(0, -1).join('/');
  if (!(await existsPromise(dirPath))) {
    await fs.mkdir(dirPath, { recursive: true });
  }
  // Use fs.writeFile to write JSON data to a file

  return fs.writeFile(filePath, jsonData);
};
export const readAlovaJson = async (originPath: string, name = 'api.json') => {
  // Define the path and name of the JSON file

  const filePath = `${originPath}_${name}`;
  if (!(await existsPromise(filePath))) {
    throw logger.error('alovaJson is not exists', undefined, 'debug');
  }

  // Read JSON files using fs.readFile

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
