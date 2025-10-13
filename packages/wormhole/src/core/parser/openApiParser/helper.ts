import type { OpenAPIDocument, OpenAPIV2Document, PlatformType } from '@/type'
import type { FetchOptions } from '@/utils/base'
import fs from 'node:fs/promises'
import path from 'node:path'
import importFresh from 'import-fresh'
import YAML from 'js-yaml'
import swagger2openapi from 'swagger2openapi'
import { logger } from '@/helper'
import { fetchData } from '@/utils'

const supportedExtname = ['json', 'yaml']
const supportedPlatformType: PlatformType[] = ['swagger']
function isSwagger2(data: any): data is OpenAPIV2Document {
  return !!data?.swagger
}
// Parse local openapi files

async function parseLocalFile(url: string, projectPath = process.cwd()) {
  const [, extname] = /\.([^.]+)$/.exec(url) ?? []
  if (!supportedExtname.includes(extname)) {
    throw logger.throwError(`Unsupported file type: ${extname}`, {
      url,
      projectPath,
    })
  }
  switch (extname) {
    case 'yaml': {
      const file = await fs.readFile(path.resolve(projectPath, url), 'utf-8')
      const data = YAML.load(file) as any
      return data
    }
    // Json

    default: {
      const data = importFresh(path.resolve(projectPath, url))
      return data
    }
  }
}
// Parse remote openapi files

async function parseRemoteFile(url: string, platformType?: PlatformType, fetchOptions?: FetchOptions) {
  // no extension and platform types
  if (platformType) {
    return getPlatformOpenApiData(url, platformType, fetchOptions)
  }
  const dataText = (await fetchData(url, fetchOptions)) ?? ''
  let data: any
  try {
    // 尝试解析为 JSON 格式
    data = JSON.parse(dataText)
  }
  catch (jsonError) {
    try {
      // 若 JSON 解析失败，尝试解析为 YAML 格式
      data = YAML.load(dataText) as any
    }
    catch (yamlError) {
      throw logger.throwError(`Only JSON and YAML formats are supported. Parsing failed:
        ${jsonError instanceof Error ? jsonError.message : String(jsonError)}
        ${yamlError instanceof Error ? yamlError.message : String(yamlError)}`, {
        url,
      })
    }
  }

  // Validate if the data is valid (prevent server from returning error responses)
  if (!isValidOpenApiData(data)) {
    throw new Error(`Data retrieved from URL ${url} is not a valid OpenAPI document`)
  }

  return data
}

// Parse platform openapi files
function isValidOpenApiData(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false
  }

  // Check if it's an error response format (e.g., {"code": -1, "msg": "URL does not exist", "data": null})
  if (data.code !== undefined && data.msg !== undefined) {
    return false
  }

  // Check if it contains required OpenAPI/Swagger structure
  return !!(data.openapi || data.swagger || data.info || data.paths)
}

export async function getPlatformOpenApiData(url: string, platformType: PlatformType, fetchOptions?: FetchOptions) {
  if (!supportedPlatformType.includes(platformType)) {
    throw logger.throwError(`Platform type ${platformType} is not supported.`, {
      url,
      platformType,
    })
  }
  switch (platformType) {
    case 'swagger': {
      const urlsToTry = [url, `${url}/openapi.json`, `${url}/v2/swagger.json`]

      for (const tryUrl of urlsToTry) {
        try {
          const dataText = await fetchData(tryUrl, fetchOptions)
          if (!dataText)
            continue

          const data = JSON.parse(dataText)
          if (isValidOpenApiData(data)) {
            return data
          }
          // If data is invalid, continue to next URL
        }
        catch {
          // If request or parsing fails, continue to next URL
          continue
        }
      }

      // If all URLs fail or return invalid data, throw error
      throw logger.throwError(`Unable to retrieve valid OpenAPI document from any URL: ${urlsToTry.join(', ')}`)
    }
    default:
      break
  }
}
// Parse openapi files

export async function getOpenApiData(
  url: string,
  options?: {
    projectPath?: string
    platformType?: PlatformType
    fetchOptions?: FetchOptions
  },
): Promise<OpenAPIDocument> {
  let data: OpenAPIDocument | null = null
  const { projectPath, platformType, fetchOptions } = options ?? {}
  try {
    if (!/^https?:\/\//.test(url)) {
      // local file
      data = await parseLocalFile(url, projectPath)
    }
    else {
      // remote file
      data = await parseRemoteFile(url, platformType, fetchOptions)
    }
    // If it is a swagger2 file
    if (isSwagger2(data)) {
      data = (await swagger2openapi.convertObj(data, { warnOnly: true })).openapi as OpenAPIDocument
    }
  }
  catch (error: any) {
    throw logger.throwError(`Cannot read file from ${url}`, {
      error: error.message,
      projectPath,
      url,
      platformType,
      fetchOptions,
    })
  }
  if (!data) {
    throw logger.throwError(`Cannot read file from ${url}`, {
      projectPath,
      url,
      platformType,
      fetchOptions,
    })
  }
  return data
}
