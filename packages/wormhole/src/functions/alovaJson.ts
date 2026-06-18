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

function cacheDirPath(projectRoot: string) {
  return path.join(projectRoot, getGlobalConfig().cacheDir)
}

// ---- M3-B2: API hash computation ----

/** Compute stable hash for a single API (only essential fields) */
export function computeApiHash(api: Api): string {
  const { tag, method, path: apiPath, name, response, requestBody, queryParameters, pathParameters } = api
  return createHash('sha256')
    .update(JSON.stringify({ tag, method, path: apiPath, name, response, requestBody, queryParameters, pathParameters }))
    .digest('hex')
    .slice(0, 16)
}

/** Compute aggregate hash + per-tag hashes for a set of APIs */
export function computePerTagHashes(allApis: Api[]): { hash: string, tags: Record<string, string> } {
  const tagGroups = new Map<string, Api[]>()
  for (const api of allApis) {
    const group = tagGroups.get(api.tag) || []
    group.push(api)
    tagGroups.set(api.tag, group)
  }
  const tags: Record<string, string> = {}
  const allHashes: string[] = []
  for (const [tag, groupApis] of tagGroups) {
    const hashes = groupApis.map(computeApiHash).sort()
    allHashes.push(...hashes)
    tags[tag] = createHash('sha256').update(hashes.join('')).digest('hex').slice(0, 16)
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

export async function writeCacheEntry(
  projectRoot: string,
  outputPath: string,
  serverName: string,
  apis: Api[],
  hashInfo: { hash: string, tags: Record<string, string> },
): Promise<void> {
  const dir = cacheDirPath(projectRoot)
  const dataDir = path.join(dir, 'data')
  const slug = slugify(outputPath)
  const entryFile = path.join(dataDir, `${slug}.json`)

  await fs.mkdir(path.dirname(entryFile), { recursive: true })
  // Write without indent for reduced disk size
  await fs.writeFile(entryFile, JSON.stringify({ serverName, apis }))

  // Update index
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

  const newEntry: CacheIndexEntry = {
    path: outputPath,
    serverName,
    hash: hashInfo.hash,
    tags: hashInfo.tags,
  }
  const existingIdx = index.entries.findIndex(e => e.path === outputPath)
  if (existingIdx >= 0)
    index.entries[existingIdx] = newEntry
  else index.entries.push(newEntry)
  index.entries.sort((a, b) => a.path.localeCompare(b.path))

  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, 'index.json'), JSON.stringify(index))
}

/** Read APIs from cache directory */
export async function readCacheApis(projectRoot: string, outputPath: string): Promise<CacheData | null> {
  const index = await readCacheIndex(projectRoot)
  if (index) {
    const entry = index.entries.find(e => e.path === outputPath)
    if (entry) {
      const slug = slugify(outputPath)
      const entryFile = path.join(cacheDirPath(projectRoot), 'data', `${slug}.json`)
      try {
        const content = JSON.parse(await fs.readFile(entryFile, 'utf-8'))
        return { path: outputPath, serverName: content.serverName, apis: content.apis }
      }
      catch { return null }
    }
  }
  return null
}

/** Get cache entry metadata (hash + tags) without loading APIs */
export async function getCacheEntry(projectRoot: string, outputPath: string): Promise<CacheIndexEntry | null> {
  const index = await readCacheIndex(projectRoot)
  if (!index)
    return null
  return index.entries.find(e => e.path === outputPath) ?? null
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
