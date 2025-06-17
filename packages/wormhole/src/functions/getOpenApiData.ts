import { getGlobalConfig } from '@/config';
import type { PlatformType } from '@/interface.type';
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
  let data: any;
  switch (extname) {
    case 'yaml': {
      data = YAML.load(dataText) as any;
      break;
    }
    // Json

    default: {
      data = JSON.parse(dataText);
      break;
    }
  }

  // Validate if the data is valid (prevent server from returning error responses)
  if (!isValidOpenApiData(data)) {
    throw new Error(`Data retrieved from URL ${url} is not a valid OpenAPI document`);
  }

  return data;
}

// Parse platform openapi files
function isValidOpenApiData(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check if it's an error response format (e.g., {"code": -1, "msg": "URL does not exist", "data": null})
  if (data.code !== undefined && data.msg !== undefined) {
    return false;
  }

  // Check if it contains required OpenAPI/Swagger structure
  return !!(data.openapi || data.swagger || data.info || data.paths);
}

export async function getPlatformOpenApiData(url: string, platformType: PlatformType) {
  switch (platformType) {
    case 'swagger': {
      const urlsToTry = [url, `${url}/openapi.json`, `${url}/v2/swagger.json`];

      for (const tryUrl of urlsToTry) {
        try {
          const dataText = await fetchData(tryUrl);
          if (!dataText) continue;

          const data = JSON.parse(dataText);
          if (isValidOpenApiData(data)) {
            return data;
          }
          // If data is invalid, continue to next URL
        } catch {
          // If request or parsing fails, continue to next URL
          continue;
        }
      }

      // If all URLs fail or return invalid data, throw error
      throw new Error(`Unable to retrieve valid OpenAPI document from any URL: ${urlsToTry.join(', ')}`);
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
