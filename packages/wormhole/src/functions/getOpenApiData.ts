import { DEFAULT_CONFIG } from '@/config';
import { fetchData } from '@/utils';
import importFresh from 'import-fresh';
import YAML from 'js-yaml';
import fs from 'node:fs/promises';
import path from 'node:path';
import { OpenAPIV2, OpenAPIV3_1 } from 'openapi-types';
import swagger2openapi from 'swagger2openapi';
import type { PlatformType } from '~/index';
// 判断是否是swagger2.0
function isSwagger2(data: any): data is OpenAPIV2.Document {
  return !!data?.swagger;
}
// 解析本地openapi文件
async function parseLocalFile(workspaceRootDir: string, filePath: string) {
  const [, extname] = /\.([^.]+)$/.exec(filePath) ?? [];
  switch (extname) {
    case 'yaml': {
      const file = await fs.readFile(path.resolve(workspaceRootDir, filePath), 'utf-8');
      const data = YAML.load(file) as any;
      return data;
    }
    // json
    default: {
      const data = importFresh(path.resolve(workspaceRootDir, filePath));
      return data;
    }
  }
}
// 解析远程openapi文件
async function parseRemoteFile(url: string, platformType?: PlatformType) {
  const [, , extname] = /^http(s)?:\/\/.+\/.+\.([^.]+)$/.exec(url) ?? [];
  // 没有扩展名并且有平台类型
  if (!extname && platformType) {
    return getPlatformOpenApiData(url, platformType);
  }
  // 没有平台类型并且没有扩展名
  if (!platformType && !extname) {
    return;
  }
  // 没有平台类型并且有扩展名
  const dataText = (await fetchData(url)) ?? '';
  switch (extname) {
    case 'yaml': {
      const data = YAML.load(dataText) as any;
      return data;
    }
    // json
    default: {
      return JSON.parse(dataText);
    }
  }
}
// 解析平台openapi文件
export async function getPlatformOpenApiData(url: string, platformType: PlatformType) {
  switch (platformType) {
    case 'swagger': {
      const dataText =
        (await fetchData(url)
          .then(text => JSON.stringify(JSON.parse(text)))
          .catch(() => fetchData(`${url}/openapi.json`))
          .catch(() => fetchData(`${url}/v2/swagger.json`))) ?? '';
      return JSON.parse(dataText);
    }
    default:
      break;
  }
}
// 解析openapi文件
export default async function (
  workspaceRootDir: string,
  url: string,
  platformType?: PlatformType
): Promise<OpenAPIV3_1.Document> {
  let data: OpenAPIV3_1.Document | null = null;
  try {
    if (!/^http(s)?:\/\//.test(url)) {
      // 本地文件
      data = await parseLocalFile(workspaceRootDir, url);
    } else {
      // 远程文件
      data = await parseRemoteFile(url, platformType);
    }
    // 如果是swagger2的文件
    if (isSwagger2(data)) {
      data = (await swagger2openapi.convertObj(data, { warnOnly: true })).openapi as OpenAPIV3_1.Document;
    }
  } catch (error) {
    throw new DEFAULT_CONFIG.Error(`Cannot read file from ${url}`);
  }
  if (!data) {
    throw new DEFAULT_CONFIG.Error(`Cannot read file from ${url}`);
  }
  return data;
}
