import { logger } from '@/helper';
import type { OpenAPIDocument, OpenAPIV2Document, PlatformType } from '@/type';
import { fetchData } from '@/utils';
import importFresh from 'import-fresh';
import YAML from 'js-yaml';
import fs from 'node:fs/promises';
import path from 'node:path';
import swagger2openapi from 'swagger2openapi';

const supportedExtname = ['json', 'yaml'];
const supportedPlatformType: PlatformType[] = ['swagger'];
function isSwagger2(data: any): data is OpenAPIV2Document {
  return !!data?.swagger;
}
// Parse local openapi files

async function parseLocalFile(url: string, projectPath = process.cwd()) {
  const [, extname] = /\.([^.]+)$/.exec(url) ?? [];
  if (!supportedExtname.includes(extname)) {
    throw logger.throwError(`Unsupported file type: ${extname}`, {
      url,
      projectPath
    });
  }
  switch (extname) {
    case 'yaml': {
      const file = await fs.readFile(path.resolve(projectPath, url), 'utf-8');
      const data = YAML.load(file) as any;
      return data;
    }
    // Json

    default: {
      const data = importFresh(path.resolve(projectPath, url));
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
    logger.debug('No platform type and no extension', {
      url,
      platformType
    });
    return;
  }
  // There is no platform type and there is an extension
  if (!supportedExtname.includes(extname)) {
    throw logger.throwError(`Unsupported file type: ${extname}`, {
      url,
      platformType
    });
  }
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
  if (!supportedPlatformType.includes(platformType)) {
    throw logger.throwError(`Platform type ${platformType} is not supported.`, {
      url,
      platformType
    });
  }
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

export async function getOpenApiData(
  url: string,
  projectPath?: string,
  platformType?: PlatformType
): Promise<OpenAPIDocument> {
  let data: OpenAPIDocument | null = null;
  try {
    if (!/^http(s)?:\/\//.test(url)) {
      // local file
      data = await parseLocalFile(url, projectPath);
    } else {
      // remote file
      data = await parseRemoteFile(url, platformType);
    }
    // If it is a swagger2 file
    if (isSwagger2(data)) {
      data = (await swagger2openapi.convertObj(data, { warnOnly: true })).openapi as OpenAPIDocument;
    }
  } catch (error: any) {
    throw logger.throwError(`Cannot read file from ${url}`, {
      error: error.message,
      projectPath,
      url,
      platformType
    });
  }
  if (!data) {
    throw logger.throwError(`Cannot read file from ${url}`, {
      projectPath,
      url,
      platformType
    });
  }
  return data;
}
