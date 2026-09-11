import type { Api, CacheData } from '@/type'
import type { GeneratorConfig, TemplateData } from '@/type/lib'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import YAML from 'js-yaml'
import { getGlobalConfig } from '@/config'

// ---- Directory-based cache format ----

const CACHE_SCHEMA_VERSION = 1

/**
 * Source-level baseline recorded for update detection (requirement A).
 * Only ever written by `checkUpdates()` / `generate()` — the generation-side
 * `hash` / `tags` fields are never touched by detection.
 */
export interface CacheSourceBaseline {
  /** The URL / file that actually served the spec (cache key for detection) */
  resolvedInput?: string
  /** Normalized hash of the raw spec text */
  rawHash?: string
  /** Timestamp when the baseline was established */
  updatedAt?: number
}

interface CacheIndexEntry {
  path: string
  serverName: string
  /** Aggregate hash of all APIs (for quick full comparison) */
  hash: string
  /** Tag name → hash of that tag's APIs (for incremental comparison) */
  tags: Record<string, string>
  /** Source-level detection baseline (requirement A) */
  source?: CacheSourceBaseline
}

interface CacheIndex {
  schemaVersion: number
  entries: CacheIndexEntry[]
  /** Monotonic counter backing `changes/<NNNN>.json` ids (requirement B) */
  changeSeq?: number
}

function slugify(p: string) {
  return p.replace(/[\\/.]/g, '_').replace(/[^\w-]/g, '').slice(0, 128)
}

/** Get the effective cache root directory. When cacheRoot is set in global config, it overrides projectRoot. */
export function getCacheRoot(projectRoot: string): string {
  return getGlobalConfig().cacheRoot || projectRoot
}

export function cacheDirPath(projectRoot: string) {
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

// ---- Spec text normalization + hashing (requirement A) ----

/**
 * Deterministic JSON serialization: object keys are sorted so that two
 * semantically equal documents always produce the same string.
 */
export function stableStringify(value: unknown): string {
  if (value === undefined)
    return 'undefined'
  if (value === null || typeof value !== 'object')
    return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value))
    return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map(k => `${JSON.stringify(k)}:${stableStringify(record[k])}`).join(',')}}`
}

/**
 * Parse a raw spec text (JSON or YAML) into a plain structure.
 * Throws when the text cannot be parsed at all.
 */
export function parseSpecText(text: string): unknown {
  try {
    return JSON.parse(text)
  }
  catch {
    const loaded = YAML.load(text)
    if (loaded !== undefined)
      return loaded
    throw new Error('Unable to parse spec text as JSON or YAML')
  }
}

/**
 * Normalize a raw spec text into a canonical form so that cosmetic differences
 * (key order, indentation, JSON vs YAML, trailing whitespace) collapse into the
 * same value. Falls back to the raw (trimmed) text when it is not a structured
 * document.
 */
export function normalizeSpecText(text: string): string {
  try {
    const parsed = parseSpecText(text)
    if (parsed && typeof parsed === 'object')
      return stableStringify(parsed)
  }
  catch { /* not a structured document — fall through */ }
  return text.trim()
}

/**
 * Compute a stable hash of a raw spec text (JSON or YAML).
 * Stable across key reordering, whitespace and JSON/YAML equivalence.
 */
export function computeSpecHash(text: string): string {
  return createHash('sha256').update(normalizeSpecText(text)).digest('hex').slice(0, 16)
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
  tagedApis?: { tag: string, apis: Api[] }[],
): { hash: string, tags: Record<string, string> } {
  const tags: Record<string, string> = {}
  const allHashes: string[] = []

  if (tagedApis) {
    // P2: Use pre-grouped tagedApis to avoid O(n) re-grouping loop
    for (const { tag, apis: groupApis } of tagedApis) {
      const hashes = groupApis.map(computeApiHash).sort()
      allHashes.push(...hashes)
      tags[tag] = createHash('sha256').update(hashes.join('')).digest('hex').slice(0, 16)
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
  const indexFile = path.join(cacheDirPath(projectRoot), 'index.json')
  // Retry on parse failures: `index.json` is replaced (not appended to) by its
  // writers, so a concurrent writer can leave a truncated file behind. Reading
  // it as `null` would make the next writer start from an empty index and drop
  // `changeSeq` / `tags` / `source` baselines accumulated so far.
  for (let attempt = 0; attempt < 3; attempt++) {
    let content: string
    try {
      content = await fs.readFile(indexFile, 'utf-8')
    }
    catch {
      return null // no cache yet
    }
    try {
      const index: CacheIndex = JSON.parse(content)
      if (index.schemaVersion !== CACHE_SCHEMA_VERSION)
        return null
      if (!Array.isArray(index.entries))
        return null
      return index
    }
    catch {
      // Partially written file — back off briefly and re-read.
      if (attempt < 2)
        await new Promise(resolve => setTimeout(resolve, 10 * (attempt + 1)))
    }
  }
  return null
}

/** Whether `<cacheRoot>/.worma-cache/index.json` exists on disk (readable or not). */
async function cacheIndexExists(projectRoot: string): Promise<boolean> {
  try {
    await fs.access(path.join(cacheDirPath(projectRoot), 'index.json'))
    return true
  }
  catch {
    return false
  }
}

/** Directory holding one cache entry's per-tag data files: `data/<slug>/<tag>.json` */
function dataEntryDir(projectRoot: string, relativePath: string): string {
  return path.join(cacheDirPath(projectRoot), 'data', slugify(relativePath))
}

/** Legacy single-file location kept for backward-compatible reads: `data/<slug>.json` */
function legacyDataEntryFile(projectRoot: string, relativePath: string): string {
  return path.join(cacheDirPath(projectRoot), 'data', `${slugify(relativePath)}.json`)
}

function tagFileName(tag: string): string {
  return `${slugify(tag) || '_default'}.json`
}

/**
 * Write a single entry's API data files to disk (without updating index).
 *
 * Data is stored **per tag** (`data/<slug>/<tag>.json`) so that a large spec
 * only rewrites the files of the tags that actually changed. Tag files that no
 * longer exist in `apis` are removed.
 */
export async function writeApiCacheEntry(
  projectRoot: string,
  outputPath: string,
  serverName: string,
  apis: Api[],
): Promise<void> {
  const relativePath = toCacheRelativePath(projectRoot, outputPath)
  const dir = dataEntryDir(projectRoot, relativePath)
  await fs.mkdir(dir, { recursive: true })

  const byTag = new Map<string, Api[]>()
  for (const api of apis) {
    const tag = api.tag ?? ''
    const list = byTag.get(tag) || []
    list.push(api)
    byTag.set(tag, list)
  }

  const kept = new Set<string>()
  for (const [tag, tagApis] of byTag) {
    const fileName = tagFileName(tag)
    kept.add(fileName)
    await fs.writeFile(path.join(dir, fileName), JSON.stringify({ serverName, tag, apis: tagApis }))
  }

  // Drop tag files of tags that disappeared from the spec
  let existing: string[] = []
  try {
    existing = await fs.readdir(dir)
  }
  catch { /* directory may not exist yet */ }
  await Promise.all(
    existing
      .filter(name => name.endsWith('.json') && !kept.has(name))
      .map(name => fs.unlink(path.join(dir, name)).catch(() => {})),
  )
}

/**
 * Serializes every write to `index.json`.
 *
 * Writing the index is a read → modify → write-whole-file operation shared by
 * three call sites that all run concurrently (`flushAllData` after a
 * generation, `checkUpdates()` baselines and `captureChange()`'s sequence
 * counter). Chaining them makes the operation atomic with respect to itself, so
 * no writer can drop another's `entries`, `source` baseline or `changeSeq`.
 */
let indexWriteChain: Promise<unknown> = Promise.resolve()
function enqueueIndexWrite<T>(task: () => Promise<T>): Promise<T> {
  // `.then(task, task)` keeps the chain alive even if a previous write rejected.
  const run = indexWriteChain.then(task, task)
  indexWriteChain = run.catch(() => {})
  return run
}

/** Write/update the cache index.json from pre-computed entries. */
export function writeCacheIndex(
  projectRoot: string,
  newEntries: CacheIndexEntry[],
  options?: { changeSeq?: number },
): Promise<void> {
  return enqueueIndexWrite(async () => {
    const dir = cacheDirPath(projectRoot)
    // `readCacheIndex` retries transient read failures; falling back to an
    // empty index here would silently drop `changeSeq` and every `source` /
    // `tags` baseline accumulated so far.
    const index: CacheIndex = (await readCacheIndex(projectRoot)) ?? { schemaVersion: CACHE_SCHEMA_VERSION, entries: [] }
    if (!Array.isArray(index.entries))
      index.entries = []

    for (const newEntry of newEntries) {
      const existingIdx = index.entries.findIndex(e => e.path === newEntry.path)
      if (existingIdx >= 0) {
        // Preserve the detection baseline (`source`) written by checkUpdates()
        index.entries[existingIdx] = {
          ...newEntry,
          source: newEntry.source ?? index.entries[existingIdx].source,
        }
      }
      else {
        index.entries.push(newEntry)
      }
    }
    index.entries.sort((a, b) => a.path.localeCompare(b.path))
    if (options?.changeSeq !== undefined)
      index.changeSeq = options.changeSeq

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'index.json'), JSON.stringify(index))
  })
}

export async function writeCacheEntry(
  projectRoot: string,
  outputPath: string,
  serverName: string,
  apis: Api[],
  hashInfo: { hash: string, tags: Record<string, string> },
  source?: CacheSourceBaseline,
): Promise<void> {
  // Resolve to cache-root-relative path: in monorepo this produces e.g. "packages/a/src/api"
  const relativePath = toCacheRelativePath(projectRoot, outputPath)
  await writeApiCacheEntry(projectRoot, relativePath, serverName, apis)
  await writeCacheIndex(projectRoot, [{
    path: relativePath,
    serverName,
    hash: hashInfo.hash,
    tags: hashInfo.tags,
    source,
  }])
}

/** One baseline write request handled by {@link updateSourceBaselines}. */
export interface SourceBaselineRecord {
  outputPath: string
  serverName?: string
  source: CacheSourceBaseline
}

/**
 * Update **only** the `source` sub-field of cache index entries, leaving the
 * generation-side `hash` / `tags` untouched. Used by update detection
 * (requirement A) so that checking for updates never invalidates the
 * incremental-render baseline.
 *
 * All records are merged in a **single** read → write pass (no lost updates),
 * and concurrent callers are serialized through {@link enqueueIndexWrite}.
 */
export function updateSourceBaselines(
  projectRoot: string,
  records: SourceBaselineRecord[],
): Promise<void> {
  if (records.length === 0)
    return Promise.resolve()
  return enqueueIndexWrite(async () => {
    const dir = cacheDirPath(projectRoot)
    const existing = await readCacheIndex(projectRoot)
    if (!existing && await cacheIndexExists(projectRoot)) {
      // `index.json` exists but could not be read (another writer is mid-write,
      // or the file is corrupt). Writing a fresh index here would wipe the
      // generation baseline (`hash` / `tags`) and `changeSeq`, so skip this
      // baseline refresh instead — detection is best-effort, generation is not.
      return
    }
    const index = existing ?? { schemaVersion: CACHE_SCHEMA_VERSION, entries: [] }
    for (const { outputPath, serverName, source } of records) {
      const relativePath = toCacheRelativePath(projectRoot, outputPath)
      const idx = index.entries.findIndex(e => e.path === relativePath)
      if (idx >= 0) {
        index.entries[idx] = {
          ...index.entries[idx],
          source: { ...index.entries[idx].source, ...source },
        }
      }
      else {
        index.entries.push({
          path: relativePath,
          serverName: serverName ?? '',
          hash: '',
          tags: {},
          source,
        })
      }
    }
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'index.json'), JSON.stringify(index))
  })
}

/**
 * Update a single entry's `source` baseline. Thin wrapper over
 * {@link updateSourceBaselines} so existing call sites stay concurrency-safe.
 */
export function updateSourceBaseline(
  projectRoot: string,
  outputPath: string,
  source: CacheSourceBaseline,
  serverName = '',
): Promise<void> {
  return updateSourceBaselines(projectRoot, [{ outputPath, serverName, source }])
}

/** Read one entry's APIs, aggregating every `data/<slug>/<tag>.json` file. */
async function readEntryApis(
  projectRoot: string,
  relativePath: string,
  fallbackServerName = '',
): Promise<CacheData | null> {
  const dir = dataEntryDir(projectRoot, relativePath)
  let files: string[] = []
  try {
    files = await fs.readdir(dir)
  }
  catch {
    // Legacy single-file layout (pre per-tag split)
    try {
      const content = JSON.parse(await fs.readFile(legacyDataEntryFile(projectRoot, relativePath), 'utf-8'))
      return {
        path: relativePath,
        serverName: content.serverName || fallbackServerName,
        apis: content.apis || [],
      }
    }
    catch {
      return null
    }
  }

  const apis: Api[] = []
  let serverName = fallbackServerName
  for (const name of files) {
    if (!name.endsWith('.json'))
      continue
    try {
      const content = JSON.parse(await fs.readFile(path.join(dir, name), 'utf-8'))
      if (content?.serverName)
        serverName = content.serverName
      if (Array.isArray(content?.apis))
        apis.push(...content.apis)
    }
    catch { /* skip corrupted data file */ }
  }
  return { path: relativePath, serverName, apis }
}

/** Read APIs from cache directory */
export async function readCacheApis(projectRoot: string, outputPath: string): Promise<CacheData | null> {
  const relativePath = toCacheRelativePath(projectRoot, outputPath)
  const index = await readCacheIndex(projectRoot)
  if (!index)
    return null
  const entry = index.entries.find(e => e.path === relativePath)
  if (!entry)
    return null
  return readEntryApis(projectRoot, relativePath, entry.serverName || '')
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
  for (const entry of index.entries) {
    const data = await readEntryApis(projectRoot, entry.path, entry.serverName || '')
    if (data)
      results.push(data)
  }
  return results
}

/** Get cache entry metadata (hash + tags + source baseline) without loading APIs */
export async function getCacheEntry(projectRoot: string, outputPath: string): Promise<CacheIndexEntry | null> {
  const relativePath = toCacheRelativePath(projectRoot, outputPath)
  const index = await readCacheIndex(projectRoot)
  if (!index)
    return null
  return index.entries.find(e => e.path === relativePath) ?? null
}

/**
 * Whether an entry carries a usable incremental-render baseline.
 *
 * Entries created by update detection (`updateSourceBaseline`) only hold a
 * `source` baseline and have no `tags`, so they must NOT be treated as
 * "everything already rendered".
 */
export function hasGenerationBaseline(entry: CacheIndexEntry | null | undefined): boolean {
  return !!entry?.tags && Object.keys(entry.tags).length > 0
}

/** Read the change-record sequence counter from index.json (requirement B). */
export async function readChangeSeq(projectRoot: string): Promise<number> {
  const index = await readCacheIndex(projectRoot)
  return index?.changeSeq ?? 0
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
