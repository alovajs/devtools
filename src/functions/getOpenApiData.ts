import YAML from 'js-yaml';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fetchData } from '../utils';
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
      return data;
    }
  }
}
// 解析远程openapi文件
async function parseRemoteFile(url: string, platformType?: PlatformType) {
  let filePath = url;
  if (platformType) {
    filePath += '/openapi.json';
  }
  const dataText = (await fetchData(filePath)) ?? '';
  const [, extname] = /\.([^.]+)$/.exec(filePath) ?? [];
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
export default async function (workspaceRootDir: string, url: string, platformType?: PlatformType) {
  if (!/^http(s)?:\/\//.test(url)) {
    return parseLocalFile(workspaceRootDir, url);
  }
  return parseRemoteFile(url, platformType);
}
