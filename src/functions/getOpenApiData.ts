import Error from '@/components/error';
import { fetchData } from '@/utils';
import YAML from 'js-yaml';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { OpenAPIV2, OpenAPIV3_1 } from 'openapi-types';
import swagger2openapi from 'swagger2openapi';
// 判断是否是swagger2.0
function isSwagger2(data: any): data is OpenAPIV2.Document {
  return !!data?.swagger;
}
// 解析本地openapi文件
function parseLocalFile(workspaceRootDir: string, filePath: string) {
  const [, extname] = /\.([^.]+)$/.exec(filePath) ?? [];
  switch (extname) {
    case 'yaml': {
      const file = fs.readFileSync(`${workspaceRootDir}${filePath}`, 'utf-8');
      const data = YAML.load(file) as any;
      return data;
    }
    // json
    default: {
      const workspacedRequire = createRequire(workspaceRootDir);
      const data = workspacedRequire(filePath);
      delete workspacedRequire.cache[path.resolve(workspaceRootDir, filePath)];
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
      const dataText = (await fetchData(`${url}/openapi.json`).catch(() => fetchData(`${url}/v2/swagger.json`))) ?? '';
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
      data = parseLocalFile(workspaceRootDir, url);
    } else {
      // 远程文件
      data = await parseRemoteFile(url, platformType);
    }
    // 如果是swagger2的文件
    if (isSwagger2(data)) {
      data = (await swagger2openapi.convertObj(data, {})).openapi as OpenAPIV3_1.Document;
    }
  } catch (error) {
    throw new Error(`Cannot read file from ${url}`);
  }
  if (!data) {
    throw new Error(`Cannot read file from ${url}`);
  }
  return data;
}
