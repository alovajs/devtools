import type { SourceChange } from '@/functions/diffDocument'
import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { diffSourceDocument } from '@/functions/diffDocument'
import { cacheDirPath, toCacheRelativePath } from '@/functions/wormaJson'
import { logger } from '@/helper/logger'

/** Payload version of one snapshot file. */
const SNAPSHOT_VERSION = 1

/**
 * The source document as of the last successful generation.
 *
 * It is captured **before** the `specParsed` hooks run, so the snapshot is the
 * source file the user authored (after `beforeSpecParse`), not the document the
 * plugin pipeline turns it into.
 */
export interface SourceSnapshot {
  version: number
  /** URL / file that served the spec */
  resolvedInput?: string
  /** Hash of the stable-stringified document */
  hash: string
  updatedAt: number
  /** The stable-stringified document, parsed back into a plain value */
  doc: unknown
}

/** `<cacheRoot>/.worma-cache/snapshots/` — one snapshot per generator output. */
export function snapshotsDirPath(projectRoot: string): string {
  return path.join(cacheDirPath(projectRoot), 'snapshots')
}

/**
 * Snapshot file name for one generator output.
 *
 * Keyed by the generator's `output` (resolved relative to the cache root in
 * monorepo mode, same key as the api cache) with separators turned into `_`.
 * Sharing a snapshot between generators is deliberately avoided even when they
 * read the same source: they are not necessarily generated at the same time, so
 * a shared file would let one generator's run overwrite the other's baseline.
 */
export function snapshotFilePath(projectRoot: string, outputPath: string): string {
  const relative = toCacheRelativePath(projectRoot, outputPath)
  return path.join(snapshotsDirPath(projectRoot), `${relative.replace(/[/\\]/g, '_')}.json`)
}

/** Stable hash of a stable-stringified source document. */
export function sourceDocumentHash(documentText: string): string {
  return createHash('sha256').update(documentText).digest('hex').slice(0, 16)
}

/** Read one generator's last source snapshot. */
export async function readSourceSnapshot(projectRoot: string, outputPath: string): Promise<SourceSnapshot | null> {
  try {
    const content = JSON.parse(await fs.readFile(snapshotFilePath(projectRoot, outputPath), 'utf-8'))
    if (!content || typeof content !== 'object' || typeof content.hash !== 'string')
      return null
    return content as SourceSnapshot
  }
  catch {
    return null
  }
}

/** Persist one generator's source snapshot. */
export async function writeSourceSnapshot(projectRoot: string, outputPath: string, snapshot: SourceSnapshot): Promise<void> {
  const file = snapshotFilePath(projectRoot, outputPath)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(snapshot))
}

export interface CollectSourceChangesOptions {
  projectRoot: string
  outputPath: string
  /**
   * Stable-stringified source document captured **before** the `specParsed`
   * hooks ran (they may mutate the document in place).
   */
  documentText: string
  resolvedInput?: string
}

/**
 * Compare the current source document with the previous snapshot and return the
 * change rows.
 *
 * Runs after a successful generation (a failed run must not pay for the diff nor
 * advance the baseline). The baseline is advanced on every successful run:
 *
 * - no previous snapshot → the first run only establishes the baseline and stays
 *   silent, otherwise every existing project would report "everything changed";
 * - identical hash → nothing to do, not even a write;
 * - otherwise → the structured diff is returned and the snapshot is replaced.
 *
 * @returns the change rows, or `undefined` when there is nothing to record.
 */
export async function collectSourceChanges(options: CollectSourceChangesOptions): Promise<SourceChange[] | undefined> {
  const { projectRoot, outputPath, documentText, resolvedInput } = options

  const hash = sourceDocumentHash(documentText)
  const previous = await readSourceSnapshot(projectRoot, outputPath)
  if (previous && previous.hash === hash)
    return undefined

  let document: unknown
  try {
    document = JSON.parse(documentText)
  }
  catch (error: any) {
    // The document is not JSON-serialisable (plugins may have attached exotic
    // values). Change history is best-effort: skip it instead of failing.
    logger.debug('Skipping source change detection: document is not serialisable', { error: error?.message })
    return undefined
  }

  let changes: SourceChange[] | undefined
  if (previous) {
    try {
      changes = diffSourceDocument(previous.doc, document)
    }
    catch (error: any) {
      logger.debug('Failed to diff source documents', { error: error?.message })
      changes = undefined
    }
  }

  await writeSourceSnapshot(projectRoot, outputPath, {
    version: SNAPSHOT_VERSION,
    resolvedInput,
    hash,
    updatedAt: Date.now(),
    doc: document,
  })

  return changes?.length ? changes : undefined
}
