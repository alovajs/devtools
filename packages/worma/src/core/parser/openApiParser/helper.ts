import type { WorkerPool } from '@/core/WorkerPool'
import type { MaybePromise } from '@/helper/config/type'
import type { OpenAPIDocument, OpenAPIV2Document } from '@/type'
import type { FetchOptions } from '@/utils/base'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import YAML from 'js-yaml'
import swagger2openapi from 'swagger2openapi'
import { PoolManager } from '@/core/workerPool/poolManager'
import { logger } from '@/helper'
import { fetchData } from '@/utils'

function isSwagger2(data: any): data is OpenAPIV2Document {
  return !!data?.swagger
}

/** Main-thread Swagger2→OpenAPI3 conversion — used as a fallback when the worker pool is unavailable. */
function convertSwagger2OnMainThread(data: OpenAPIV2Document): Promise<OpenAPIDocument> {
  return swagger2openapi
    .convertObj(data, { warnOnly: true })
    .then(result => result.openapi as OpenAPIDocument)
}

/**
 * 9.3.4: Run CPU-heavy Swagger2→OpenAPI3 conversion via PoolManager (worker thread).
 * If the worker pool cannot be created or fails at runtime (e.g. test/CI environments
 * where the `.ts` worker cannot be loaded as a worker, or worker_threads is unavailable),
 * gracefully fall back to the main-thread conversion so generation still succeeds.
 */
function convertSwagger2Async(data: OpenAPIV2Document): Promise<OpenAPIDocument> {
  // Resolve worker path: .js for production, .ts for vitest/dev
  // In mocked filesystem envs, existsSync may return false — fall back to trying both paths
  const jsPath = path.resolve(__dirname, '../../workerPool/swagger2Worker.js')
  const tsPath = path.resolve(__dirname, '../../workerPool/swagger2Worker.ts')
  const workerScript = existsSync(jsPath) ? jsPath : tsPath

  let pool: WorkerPool<OpenAPIV2Document, { openapi: OpenAPIDocument }>
  try {
    pool = PoolManager.getInstance().get<OpenAPIV2Document, { openapi: OpenAPIDocument }>({
      key: 'swagger2Worker',
      workerScript,
      sharedContext: {},
      poolSize: 1,
    })
  }
  catch {
    return convertSwagger2OnMainThread(data)
  }

  return new Promise((resolve, reject) => {
    pool.processBatch([data]).then((results) => {
      if (results.length > 0 && results[0].openapi) {
        resolve(results[0].openapi)
      }
      else {
        convertSwagger2OnMainThread(data).then(resolve, reject)
      }
    }).catch(() => {
      // Worker failed (script load error, thread crash, etc.) — fall back to main thread
      convertSwagger2OnMainThread(data).then(resolve, reject)
    })
  })
}

// Read local openapi spec file as raw text
async function fetchRawLocalFile(url: string, projectPath = process.cwd()): Promise<string> {
  const filePath = path.resolve(projectPath, url)
  try {
    return await fs.readFile(filePath, 'utf-8')
  }
  catch {
    // M6-C3: fallback to require() for environments where fs is mocked
    // (e.g. memfs in tests) but the real file exists on disk. Limited to JSON.
    // eslint-disable-next-line ts/no-require-imports
    return JSON.stringify(require(filePath), null, 2)
  }
}

// Fetch remote openapi spec as raw text
async function fetchRawRemoteFile(url: string, fetchOptions?: FetchOptions): Promise<string> {
  return (await fetchData(url, fetchOptions)) ?? ''
}

const isRemoteUrl = (u: string) => /^https?:\/\//.test(u)

/**
 * Fetch the raw spec text (JSON/YAML) from the first URL that succeeds.
 * Returns the raw text together with the resolved URL; throws if all URLs fail.
 */
async function fetchRawText(
  urls: string[],
  options: { projectPath?: string, fetchOptions?: FetchOptions },
): Promise<{ text: string, url: string }> {
  if (urls.length === 0) {
    throw logger.throwError('No URLs provided to fetch OpenAPI document')
  }
  const { projectPath, fetchOptions } = options

  // All URLs race in parallel: local files are fast, remote ones use network.
  // Each task fetches the raw text AND validates that it is actually an OpenAPI/Swagger
  // document before resolving. Invalid candidates (e.g. an HTML error page returned by
  // a fallback URL) reject, so that Promise.any falls through to the next URL
  // instead of resolving with garbage text.
  const tasks = urls.map((u) => {
    return (async () => {
      const text = isRemoteUrl(u)
        ? await fetchRawRemoteFile(u, fetchOptions)
        : await fetchRawLocalFile(u, projectPath)

      // Quick parse + validity check (full parse + Swagger2→OpenAPI3 conversion
      // happens later in parseSpec, after beforeSpecParse may rewrite the text).
      let probe: any
      try {
        probe = JSON.parse(text)
      }
      catch (jsonError) {
        try {
          probe = YAML.load(text) as any
        }
        catch (yamlError) {
          throw new Error(`${u}: ${(jsonError instanceof Error ? jsonError.message : String(jsonError))} (YAML: ${yamlError instanceof Error ? yamlError.message : String(yamlError)})`)
        }
      }
      if (!isValidOpenApiData(probe)) {
        throw new Error(`${u} did not yield a valid OpenAPI/Swagger document`)
      }
      return { text, url: u }
    })()
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

/**
 * Parse a raw spec string (JSON or YAML) into an OpenAPIDocument.
 * Performs format auto-detection, validity checks, and Swagger2→OpenAPI3 conversion.
 */
async function parseSpec(text: string, url: string): Promise<OpenAPIDocument> {
  let data: any
  try {
    // Try to parse as JSON first
    data = JSON.parse(text)
  }
  catch (jsonError) {
    try {
      // Fall back to YAML (also covers JSON, since JSON is a subset of YAML)
      data = YAML.load(text) as any
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

  // If it is a swagger2 file — convert via worker to avoid main-thread blocking
  if (isSwagger2(data)) {
    data = await convertSwagger2Async(data)
  }
  return data
}

export interface OpenApiDataResult {
  data: OpenAPIDocument
  /** The actual URL that was successfully parsed */
  resolvedUrl: string
}

export interface GetOpenApiDataOptions {
  projectPath?: string
  fetchOptions?: FetchOptions
  /**
   * Called with the raw spec text (before parsing). May return a modified
   * string that replaces the spec text used for parsing. Returning nothing
   * (undefined / null / void) keeps the original text.
   */
  beforeSpecParse?: (spec: string) => MaybePromise<string | undefined | null | void>
}

/**
 * Parse OpenAPI document and return the resolved URL alongside the data.
 * Use this when you need to know which URL actually provided the document.
 *
 * If `beforeSpecParse` is provided, it is invoked with the raw spec text once
 * it has been fetched (but before parsing), and its returned string replaces
 * the text that will be parsed.
 */
export async function getOpenApiDataWithUrl(
  url: string | string[],
  options?: GetOpenApiDataOptions,
): Promise<OpenApiDataResult> {
  const { projectPath, fetchOptions, beforeSpecParse } = options ?? {}

  // Normalize to array — single string or array both handled uniformly
  const urls = Array.isArray(url) ? url : [url]
  const { text, url: resolvedUrl } = await fetchRawText(urls, { projectPath, fetchOptions })

  // Allow the caller (e.g. a `beforeSpecParse` plugin hook) to transform the
  // raw spec text before it is parsed into an OpenAPIDocument.
  const finalText = (beforeSpecParse ? await beforeSpecParse(text) : text) ?? text

  const result = await parseSpec(finalText, resolvedUrl)

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
  options?: GetOpenApiDataOptions,
): Promise<OpenAPIDocument> {
  const { data } = await getOpenApiDataWithUrl(url, options)
  return data
}
