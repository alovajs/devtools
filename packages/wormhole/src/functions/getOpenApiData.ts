import { getGlobalConfig } from '@/config';
import type { PlatformType } from '@/type/base';
import { fetchData } from '@/utils';
import importFresh from 'import-fresh';
import YAML from 'js-yaml';
import fs from 'node:fs/promises';
import path from 'node:path';
import { OpenAPIV2, OpenAPIV3_1 } from 'openapi-types';
import swagger2openapi from 'swagger2openapi';

const DEFAULT_CONFIG = getGlobalConfig();
// Determine whether it is swagger2.0

function isSwagger2(data: any): data is OpenAPIV2.Document {
  return !!data?.swagger;
}
// Parse local openapi files

async function parseLocalFile(workspaceRootDir: string, filePath: string) {
  const [, extname] = /\.([^.]+)$/.exec(filePath) ?? [];
  switch (extname) {
    case 'yaml': {
      const file = await fs.readFile(path.resolve(workspaceRootDir, filePath), 'utf-8');
      const data = YAML.load(file) as any;
      return data;
    }
    // Json

    default: {
      const data = importFresh(path.resolve(workspaceRootDir, filePath));
      return data;
    }
  }
}
// Parse remote openapi files

async function parseRemoteFile(url: string, platformType?: PlatformType) {
  const [, , extname] = /^http(s)?:\/\/.+\/.+\.([^.]+)$/.exec(url) ?? [];
  // no extension and platform type

  if (!extname && platformType) {
    return getPlatformOpenApiData(url, platformType);
  }
  // No platform type and no extension

  if (!platformType && !extname) {
    return;
  }
  // There is no platform type and there is an extension

  const dataText = (await fetchData(url)) ?? '';
  switch (extname) {
    case 'yaml': {
      const data = YAML.load(dataText) as any;
      return data;
    }
    // Json

    default: {
      return JSON.parse(dataText);
    }
  }
}
// Parse platform openapi files

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
// Parse openapi files

export default async function (
  workspaceRootDir: string,
  url: string,
  platformType?: PlatformType
): Promise<OpenAPIV3_1.Document> {
  let data: OpenAPIV3_1.Document | null = null;
  try {
    if (!/^http(s)?:\/\//.test(url)) {
      // local file

      data = await parseLocalFile(workspaceRootDir, url);
    } else {
      // remote file

      data = await parseRemoteFile(url, platformType);
    }
    // If it is a swagger2 file

    if (isSwagger2(data)) {
      data = (await swagger2openapi.convertObj(data, { warnOnly: true })).openapi as OpenAPIV3_1.Document;
    }
  } catch {
    throw new DEFAULT_CONFIG.Error(`Cannot read file from ${url}`);
  }
  if (!data) {
    throw new DEFAULT_CONFIG.Error(`Cannot read file from ${url}`);
  }
  return data;
}
