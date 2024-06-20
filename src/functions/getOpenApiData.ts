import YAML from 'js-yaml';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import swagger2openapi from 'swagger2openapi';
import { fetchData } from '../utils';
import path from 'node:path';
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
      let isSwaggerV2: boolean = false;
      const dataText =
        (await fetchData(url + '/openapi.json').catch(error => {
          isSwaggerV2 = true;
          return fetchData(url + '/v2/swagger.json');
        })) ?? '';
      return isSwaggerV2 ? (await swagger2openapi.convertStr(dataText, {})).openapi : JSON.parse(dataText);
    }
    default:
      break;
  }
}
export default async function (workspaceRootDir: string, url: string, platformType?: PlatformType) {
  if (!/^http(s)?:\/\//.test(url)) {
    return parseLocalFile(workspaceRootDir, url);
  }
  return parseRemoteFile(url, platformType);
}
