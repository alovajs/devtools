import type { ApiChange, ApiFieldChange } from '@/functions/diffApis'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getGlobalConfig } from '@/config'
import { cacheDirPath, readChangeSeq, writeCacheIndex } from '@/functions/wormaJson'

/** Alias accepted by {@link getChange} — resolves to the newest record. */
export const LATEST_CHANGE_ID = 'latest'

/** One generator's (output's) contribution to a change record. */
export interface ChangeItem {
  output: string
  serverName?: string
  added: ApiChange[]
  removed: ApiChange[]
  modified: ApiFieldChange[]
}

/** Lightweight list entry returned by {@link listChanges}. */
export interface ChangeSummary {
  id: string
  createdAt: number
  summary: {
    generators: number
    added: number
    removed: number
    modified: number
  }
  outputs: string[]
}

/** A full change record — one `generate()` run aggregated. */
export interface Change {
  id: string
  createdAt: number
  projectPath: string
  generators: ChangeItem[]
}

/** `<cacheRoot>/changes/` — change records live next to the cache index. */
export function changesDirPath(projectRoot: string): string {
  return path.join(cacheDirPath(projectRoot), 'changes')
}

function recordFile(projectRoot: string, id: string): string {
  return path.join(changesDirPath(projectRoot), `${id}.json`)
}

function padId(seq: number): string {
  return String(seq).padStart(4, '0')
}

function toSummary(change: Change): ChangeSummary {
  let added = 0
  let removed = 0
  let modified = 0
  for (const gen of change.generators) {
    added += gen.added.length
    removed += gen.removed.length
    modified += gen.modified.length
  }
  return {
    id: change.id,
    createdAt: change.createdAt,
    summary: {
      generators: change.generators.length,
      added,
      removed,
      modified,
    },
    outputs: change.generators.map(g => g.output),
  }
}

/**
 * Highest id already present in `<cacheRoot>/changes/`.
 *
 * The record files — not `index.json#changeSeq` — are the authoritative source:
 * the counter lives in a file that is rewritten by several concurrent writers
 * and can be reset (corrupt / unreadable / hand-edited `index.json`). Allocating
 * from `max(counter, existing ids) + 1` keeps ids monotonic and, more
 * importantly, never reuses an id — a reused id would silently overwrite an
 * older record.
 */
async function maxChangeSeq(projectRoot: string): Promise<number> {
  let files: string[] = []
  try {
    files = await fs.readdir(changesDirPath(projectRoot))
  }
  catch {
    return 0
  }
  let max = 0
  for (const name of files) {
    const seq = Number.parseInt(name.replace(/\.json$/, ''), 10)
    if (Number.isFinite(seq) && seq > max)
      max = seq
  }
  return max
}

async function readRecord(projectRoot: string, id: string): Promise<Change | null> {
  try {
    const content = JSON.parse(await fs.readFile(recordFile(projectRoot, id), 'utf-8'))
    if (!content || typeof content !== 'object')
      return null
    return content as Change
  }
  catch {
    return null
  }
}

/**
 * Persist one change record.
 *
 * Called by `generate()` **only when something actually changed**. Allocates the
 * next `changes/<NNNN>.json` id from `index.json#changeSeq` and prunes records
 * that fall outside `changeHistoryLimit`.
 *
 * @returns the allocated id (e.g. `"0007"`)
 */
export async function captureChange(projectPath: string, change: Omit<Change, 'id'> & { id?: string }): Promise<string> {
  // Never trust the counter alone: if it was reset (see {@link maxChangeSeq})
  // `counter + 1` would collide with an existing record and overwrite it.
  const [counter, existingMax] = await Promise.all([
    readChangeSeq(projectPath),
    maxChangeSeq(projectPath),
  ])
  const seq = Math.max(counter, existingMax) + 1
  const id = padId(seq)
  const record: Change = {
    ...change,
    id,
    createdAt: change.createdAt ?? Date.now(),
  }

  const dir = changesDirPath(projectPath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(recordFile(projectPath, id), JSON.stringify(record))

  // Persist the bumped counter; `writeCacheIndex` preserves existing entries.
  await writeCacheIndex(projectPath, [], { changeSeq: seq })

  await pruneChanges(projectPath)
  return id
}

/**
 * Remove records outside the configured history window, keeping the newest
 * `changeHistoryLimit` records. `changeHistoryLimit <= 0` means "keep everything".
 *
 * Ordering is by `createdAt` (not by id): ids can be out of chronological order
 * when `index.json#changeSeq` was reset at some point, and pruning by id
 * arithmetic would then delete the newest records instead of the oldest ones.
 */
async function pruneChanges(projectPath: string): Promise<void> {
  const limit = getGlobalConfig().changeHistoryLimit
  if (typeof limit !== 'number' || limit <= 0)
    return

  // `listChanges` returns the records newest first.
  const summaries = await listChanges(projectPath)
  const stale = summaries.slice(limit)
  await Promise.all(stale.map(s => fs.unlink(recordFile(projectPath, s.id)).catch(() => {})))
}

/**
 * List recorded changes, newest first.
 *
 * Sorted by `createdAt` (id as tie-breaker) rather than by file name: an id is
 * only chronological as long as `index.json#changeSeq` never resets, and a
 * reset would otherwise make a brand-new record show up last.
 */
export async function listChanges(projectPath: string): Promise<ChangeSummary[]> {
  const dir = changesDirPath(projectPath)
  let files: string[] = []
  try {
    files = await fs.readdir(dir)
  }
  catch {
    return []
  }

  const ids = files
    .filter(name => name.endsWith('.json'))
    .map(name => name.replace(/\.json$/, ''))

  const summaries: ChangeSummary[] = []
  for (const id of ids) {
    const record = await readRecord(projectPath, id)
    if (record)
      summaries.push(toSummary(record))
  }

  summaries.sort((a, b) => (b.createdAt - a.createdAt) || b.id.localeCompare(a.id))
  return summaries
}

/**
 * Read a single change record.
 *
 * @param projectPath absolute path of the project root
 * @param id `"0007"` or the alias `"latest"` (newest record)
 */
export async function getChange(projectPath: string, id: string): Promise<Change | undefined> {
  let resolvedId = id
  if (!id || id === LATEST_CHANGE_ID) {
    // Resolve the newest record by scanning the changes directory rather than
    // trusting `index.json#changeSeq`: the counter can be stale or missing
    // (pruned records, manual edits, or a generation that rewrote index.json
    // without carrying the counter) while the record files themselves remain
    // the authoritative source.
    const latestId = await resolveLatestId(projectPath)
    if (!latestId)
      return undefined
    resolvedId = latestId
  }
  const record = await readRecord(projectPath, resolvedId)
  return record ?? undefined
}

/**
 * Return the newest change-record id.
 *
 * Resolved by `createdAt` (see {@link listChanges}) so `latest` keeps pointing
 * at the most recent generation even when ids are not chronological.
 */
async function resolveLatestId(projectRoot: string): Promise<string | undefined> {
  const [newest] = await listChanges(projectRoot)
  return newest?.id
}
