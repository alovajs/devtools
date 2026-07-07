import type { Api, CacheData } from '@/type'
import type { GeneratorConfig, TemplateData } from '@/type/lib'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getGlobalConfig } from '@/config'

// ---- Directory-based cache format ----

const CACHE_SCHEMA_VERSION = 1

interface CacheIndexEntry {
  path: string
  serverName: string
  /** Aggregate hash of all APIs (for quick full comparison) */
  hash: string
  /** Tag name → hash of that tag's APIs (for incremental comparison) */
  tags: Record<string, string>
}

interface CacheIndex {
  schemaVersion: number
  entries: CacheIndexEntry[]
}

function slugify(p: string) {
  return p.replace(/[\\/.]/g, '_').replace(/[^\w-]/g, '').slice(0, 128)
}

/** Get the effective cache root directory. When cacheRoot is set in global config, it overrides projectRoot. */
function getCacheRoot(projectRoot: string): string {
  return getGlobalConfig().cacheRoot || projectRoot
}

function cacheDirPath(projectRoot: string) {
  return path.join(getCacheRoot(projectRoot), getGlobalConfig().cacheDir)
}

/**
 * Resolve outputPath to a cache-root-relative path used as the lookup key in cache index.
 * In monorepo mode (cacheRoot ≠ projectPath), this converts a sub-package-relative path
 * to a workspace-root-relative path so all caches live under one directory.
 */
export function toCacheRelativePath(projectPath: string, outputPath: string): string {
  const cacheRoot = getGlobalConfig().cacheRoot
  if (!cacheRoot || cacheRoot === projectPath) {
    return outputPath.replace(/\\/g, '/')
  }
  const absoluteOutput = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(projectPath, outputPath)
  return (path.relative(cacheRoot, absoluteOutput) || '.').replace(/\\/g, '/')
}

// ---- M3-B2: API hash computation ----

/**
 * P2: WeakMap cache for per-Api hashes. Same Api object reused across
 * incremental runs shares the cached hash, avoiding redundant SHA256.
 */
const apiHashCache = new WeakMap<Api, string>()

/**
 * Compute stable hash for a single API (only essential fields).
 * Result is cached per Api object identity via WeakMap.
 */
export function computeApiHash(api: Api): string {
  if (apiHashCache.has(api)) {
    return apiHashCache.get(api)!
  }
  const { tag, method, path: apiPath, name, response, requestBody, queryParameters, pathParameters } = api
  const hash = createHash('sha256')
    .update(JSON.stringify({ tag, method, path: apiPath, name, response, requestBody, queryParameters, pathParameters }))
    .digest('hex')
    .slice(0, 16)
  apiHashCache.set(api, hash)
  return hash
}

/**
 * Compute aggregate hash + per-tag hashes for a set of APIs.
 * When `tagedApis` is provided, avoids re-grouping APIs by tag.
 */
export function computePerTagHashes(
  allApis: Api[],
  tagedApis?: { tagName: string, apis: Api[] }[],
): { hash: string, tags: Record<string, string> } {
  const tags: Record<string, string> = {}
  const allHashes: string[] = []

  if (tagedApis) {
    // P2: Use pre-grouped tagedApis to avoid O(n) re-grouping loop
    for (const { tagName, apis: groupApis } of tagedApis) {
      const hashes = groupApis.map(computeApiHash).sort()
      allHashes.push(...hashes)
      tags[tagName] = createHash('sha256').update(hashes.join('')).digest('hex').slice(0, 16)
    }
  }
  else {
    const tagGroups = new Map<string, Api[]>()
    for (const api of allApis) {
      const group = tagGroups.get(api.tag) || []
      group.push(api)
      tagGroups.set(api.tag, group)
    }
    for (const [tag, groupApis] of tagGroups) {
      const hashes = groupApis.map(computeApiHash).sort()
      allHashes.push(...hashes)
      tags[tag] = createHash('sha256').update(hashes.join('')).digest('hex').slice(0, 16)
    }
  }

  const aggregateHash = createHash('sha256').update(allHashes.sort().join('')).digest('hex').slice(0, 16)
  return { hash: aggregateHash, tags }
}

// ---- M3-B3: New format read/write ----

export async function readCacheIndex(projectRoot: string): Promise<CacheIndex | null> {
  try {
    const indexFile = path.join(cacheDirPath(projectRoot), 'index.json')
    const content = await fs.readFile(indexFile, 'utf-8')
    const index: CacheIndex = JSON.parse(content)
    if (index.schemaVersion !== CACHE_SCHEMA_VERSION)
      return null
    if (!Array.isArray(index.entries))
      return null
    return index
  }
  catch { return null }
}

/** Write a single entry's API data file to disk (without updating index). */
export async function writeApiCacheEntry(
  projectRoot: string,
  outputPath: string,
  serverName: string,
  apis: Api[],
): Promise<void> {
  const dataDir = path.join(cacheDirPath(projectRoot), 'data')
  const slug = slugify(outputPath)
  const entryFile = path.join(dataDir, `${slug}.json`)
  await fs.mkdir(path.dirname(entryFile), { recursive: true })
  await fs.writeFile(entryFile, JSON.stringify({ serverName, apis }))
}

/** Write/update the cache index.json from pre-computed entries. */
export async function writeCacheIndex(
  projectRoot: string,
  newEntries: CacheIndexEntry[],
): Promise<void> {
  const dir = cacheDirPath(projectRoot)
  let index: CacheIndex
  try {
    const indexFile = path.join(dir, 'index.json')
    index = JSON.parse(await fs.readFile(indexFile, 'utf-8'))
    if (index.schemaVersion !== CACHE_SCHEMA_VERSION)
      index = { schemaVersion: CACHE_SCHEMA_VERSION, entries: [] }
  }
  catch {
    index = { schemaVersion: CACHE_SCHEMA_VERSION, entries: [] }
  }

  for (const newEntry of newEntries) {
    const existingIdx = index.entries.findIndex(e => e.path === newEntry.path)
    if (existingIdx >= 0)
      index.entries[existingIdx] = newEntry
    else index.entries.push(newEntry)
  }
  index.entries.sort((a, b) => a.path.localeCompare(b.path))

  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, 'index.json'), JSON.stringify(index))
}

export async function writeCacheEntry(
  projectRoot: string,
  outputPath: string,
  serverName: string,
  apis: Api[],
  hashInfo: { hash: string, tags: Record<string, string> },
): Promise<void> {
  // Resolve to cache-root-relative path: in monorepo this produces e.g. "packages/a/src/api"
  const relativePath = toCacheRelativePath(projectRoot, outputPath)
  await writeApiCacheEntry(projectRoot, relativePath, serverName, apis)
  await writeCacheIndex(projectRoot, [{ path: relativePath, serverName, hash: hashInfo.hash, tags: hashInfo.tags }])
}

/** Read APIs from cache directory */
export async function readCacheApis(projectRoot: string, outputPath: string): Promise<CacheData | null> {
  const relativePath = toCacheRelativePath(projectRoot, outputPath)
  const index = await readCacheIndex(projectRoot)
  if (index) {
    const entry = index.entries.find(e => e.path === relativePath)
    if (entry) {
      const slug = slugify(relativePath)
      const entryFile = path.join(cacheDirPath(projectRoot), 'data', `${slug}.json`)
      try {
        const content = JSON.parse(await fs.readFile(entryFile, 'utf-8'))
        return { path: relativePath, serverName: content.serverName, apis: content.apis }
      }
      catch { return null }
    }
  }
  return null
}

/**
 * Read ALL cached API entries from the unified cache directory.
 * In monorepo mode where cacheRoot unifies all sub-package caches,
 * this returns entries from every sub-project at once.
 */
export async function readAllCacheApis(projectRoot: string): Promise<CacheData[]> {
  const index = await readCacheIndex(projectRoot)
  if (!index)
    return []

  const results: CacheData[] = []
  const dataDir = path.join(cacheDirPath(projectRoot), 'data')

  for (const entry of index.entries) {
    const slug = slugify(entry.path)
    const entryFile = path.join(dataDir, `${slug}.json`)
    try {
      const content = JSON.parse(await fs.readFile(entryFile, 'utf-8'))
      results.push({
        path: entry.path,
        serverName: content.serverName || entry.serverName || '',
        apis: content.apis || [],
      })
    }
    catch { /* skip corrupted data file */ }
  }
  return results
}

/** Get cache entry metadata (hash + tags) without loading APIs */
export async function getCacheEntry(projectRoot: string, outputPath: string): Promise<CacheIndexEntry | null> {
  const relativePath = toCacheRelativePath(projectRoot, outputPath)
  const index = await readCacheIndex(projectRoot)
  if (!index)
    return null
  return index.entries.find(e => e.path === relativePath) ?? null
}

/** Find set of tags whose hash differs between old and new */
export function diffChangedTags(
  oldTags: Record<string, string>,
  newTags: Record<string, string>,
): Set<string> {
  const changed = new Set<string>()
  for (const [tag, tagHash] of Object.entries(newTags)) {
    if (oldTags[tag] !== tagHash)
      changed.add(tag)
  }
  for (const tag of Object.keys(oldTags)) {
    if (!newTags[tag])
      changed.add(tag) // removed tags
  }
  return changed
}

/**
 * Convert TemplateData to standardized CacheData entry.
 */
export function toCacheData(
  templateData: TemplateData,
  outputPath: string,
  config?: GeneratorConfig,
): CacheData {
  return {
    path: outputPath,
    serverName: config?.serverName || templateData.title || '',
    apis: templateData.allApis || [],
  }
}
