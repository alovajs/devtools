import type { OpenAPIDocument, OpenAPIV2Document, PlatformType } from '@/type'
import type { FetchOptions } from '@/utils/base'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import YAML from 'js-yaml'
import { PlatformTypeEnum } from '@/constant'
import { WorkerPool } from '@/core/WorkerPool'
import { logger } from '@/helper'
import { fetchData } from '@/utils'

const supportedExtname = ['json', 'yaml']
const supportedPlatformType: PlatformType[] = [PlatformTypeEnum.SWAGGER]
function isSwagger2(data: any): data is OpenAPIV2Document {
  return !!data?.swagger
}

/** 9.3.4: Run CPU-heavy Swagger2→OpenAPI3 conversion via WorkerPool */
function convertSwagger2Async(data: OpenAPIV2Document): Promise<OpenAPIDocument> {
  return new Promise((resolve, reject) => {
    // Resolve worker path: .js for production, .ts for vitest/dev
    // In mocked filesystem envs, existsSync may return false — fall back to trying both paths
    const jsPath = path.resolve(__dirname, '../../workerPool/swagger2Worker.js')
    const tsPath = path.resolve(__dirname, '../../workerPool/swagger2Worker.ts')
    const workerScript = existsSync(jsPath) ? jsPath : tsPath

    const pool = new WorkerPool<OpenAPIV2Document, { openapi: OpenAPIDocument }>({
      workerScript,
      sharedContext: {},
      poolSize: 1,
    })
    pool.processBatch([data]).then((results) => {
      if (results.length > 0 && results[0].openapi) {
        resolve(results[0].openapi)
      }
      else {
        reject(new Error('Empty result from swagger2 conversion'))
      }
    }).catch(reject)
  })
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
  const filePath = path.resolve(projectPath, url)

  if (extname === 'yaml') {
    return YAML.load(await fs.readFile(filePath, 'utf-8')) as any
  }
  // M6-C3: prefer async read, fallback to require() for environments where
  // fs is mocked (e.g. memfs in tests) but the real file exists on disk
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8'))
  }
  catch {
    // Fallback: use require() which bypasses fs mocks to reach real disk
    // eslint-disable-next-line ts/no-require-imports
    return require(filePath) as any
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
    case PlatformTypeEnum.SWAGGER: {
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
  if (!/^https?:\/\//.test(url)) {
    // local file
    data = await parseLocalFile(url, projectPath)
  }
  else {
    // remote file
    data = await parseRemoteFile(url, platformType, fetchOptions)
  }
  // If it is a swagger2 file — convert via worker to avoid main-thread blocking
  if (isSwagger2(data)) {
    data = await convertSwagger2Async(data)
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
