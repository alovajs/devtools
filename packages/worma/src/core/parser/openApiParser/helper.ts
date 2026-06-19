import type { OpenAPIDocument, OpenAPIV2Document } from '@/type'
import type { FetchOptions } from '@/utils/base'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import YAML from 'js-yaml'
import { WorkerPool } from '@/core/WorkerPool'
import { logger } from '@/helper'
import { fetchData } from '@/utils'

const supportedExtname = ['json', 'yaml']
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

async function parseRemoteFile(url: string, fetchOptions?: FetchOptions) {
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

// Validate OpenAPI data
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

const isRemoteUrl = (u: string) => /^https?:\/\//.test(u)

/**
 * Try all URLs in parallel (local & remote) — first successful one wins.
 * Returns the parsed data together with the resolved URL; throws if all URLs fail.
 */
async function tryUrls(
  urls: string[],
  options: { projectPath?: string; fetchOptions?: FetchOptions },
): Promise<{ data: any; url: string }> {
  if (urls.length === 0) {
    throw logger.throwError('No URLs provided to fetch OpenAPI document')
  }
  const { projectPath, fetchOptions } = options

  // All URLs race in parallel: local files are fast, remote ones use network
  const tasks = urls.map((u) => {
    if (isRemoteUrl(u)) {
      return parseRemoteFile(u, fetchOptions).then(
        data => ({ data, url: u }),
        (err) => {
          throw new Error(`${u}: ${err instanceof Error ? err.message : String(err)}`)
        },
      )
    }
    return parseLocalFile(u, projectPath).then(data => ({ data, url: u }))
  })

  try {
    return await Promise.any(tasks)
  }
  catch (err) {
    const errors = (err instanceof AggregateError)
      ? err.errors.map((e: any) => e.message)
      : [(err as Error).message]
    throw logger.throwError(`Unable to retrieve valid OpenAPI document from any URL:\n${errors.join('\n')}`)
  }
}

export interface OpenApiDataResult {
  data: OpenAPIDocument
  /** The actual URL that was successfully parsed */
  resolvedUrl: string
}

/**
 * Parse OpenAPI document and return the resolved URL alongside the data.
 * Use this when you need to know which URL actually provided the document.
 */
export async function getOpenApiDataWithUrl(
  url: string | string[],
  options?: {
    projectPath?: string
    fetchOptions?: FetchOptions
  },
): Promise<OpenApiDataResult> {
  const { projectPath, fetchOptions } = options ?? {}

  // Normalize to array — single string or array both handled uniformly
  const urls = Array.isArray(url) ? url : [url]
  const { data, url: resolvedUrl } = await tryUrls(urls, { projectPath, fetchOptions })
  let result = data

  // If it is a swagger2 file — convert via worker to avoid main-thread blocking
  if (isSwagger2(result)) {
    result = await convertSwagger2Async(result)
  }
  if (!result) {
    throw logger.throwError(`Cannot read file from ${urls.join(', ')}`, {
      projectPath,
      url,
      fetchOptions,
    })
  }
  return { data: result, resolvedUrl }
}

/**
 * Parse OpenAPI document from config input.
 * Backward-compatible: wraps {@link getOpenApiDataWithUrl}, returning only the document.
 */
export async function getOpenApiData(
  url: string | string[],
  options?: {
    projectPath?: string
    fetchOptions?: FetchOptions
  },
): Promise<OpenAPIDocument> {
  const { data } = await getOpenApiDataWithUrl(url, options)
  return data
}
