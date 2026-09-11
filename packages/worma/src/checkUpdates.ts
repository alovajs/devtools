import type { SourceBaselineRecord } from '@/functions/wormaJson'
import type { Config } from '@/type/lib'
import { getRawSpecText } from '@/core/parser/openApiParser/helper'
import { prepareConfig } from '@/functions/prepareConfig'
import {
  computeSpecHash,
  getCacheEntry,
  readCacheIndex,
  updateSourceBaselines,
} from '@/functions/wormaJson'

export type SourceStatus = 'unchanged' | 'changed' | 'new' | 'error'

export interface SourceUpdateInfo {
  /** Index inside `config.generator` */
  index: number
  output: string
  serverName?: string
  status: SourceStatus
  /** The URL / file that actually served the spec — also the cache key */
  resolvedInput?: string
  /** Normalized hash of the raw spec text */
  hash?: string
  error?: string
}

export interface CheckUpdatesResult {
  projectPath: string
  updates: SourceUpdateInfo[]
  hasChanges: boolean
  /**
   * Whether the project already carries a generation baseline (any index entry
   * with a non-empty `tags` map). Lets callers decide whether a `new` source is
   * worth surfacing: a brand-new project must stay silent on its first run,
   * while an established project that gained a source should be noticed.
   */
  hasGenerationBaseline: boolean
}

/**
 * Detect whether the configured OpenAPI sources changed since the last
 * recorded baseline.
 *
 * This is a **source-level, side-effect free** check:
 *
 * - it only hashes the raw spec text — no parsing, no plugin hooks;
 * - it only reads/writes the `source` sub-field of `index.json` entries, never
 *   the generation-side `hash` / `tags`;
 * - when no baseline exists yet (`new`) it writes the baseline silently and
 *   does *not* report a change (first run must not nag the user).
 *
 * Nothing on the user's disk is rewritten — callers decide what to do with the
 * result (the VS Code extension asks for confirmation before generating).
 */
export async function checkUpdates(
  config: Config,
  options?: { projectPath?: string },
): Promise<CheckUpdatesResult> {
  const projectPath = options?.projectPath ?? process.cwd()
  const generators = config?.generator ?? []

  const cacheIndex = await readCacheIndex(projectPath)
  const hasGenerationBaseline = !!cacheIndex?.entries?.some(
    entry => !!entry.tags && Object.keys(entry.tags).length > 0,
  )

  // Collect `new` baselines and persist them in a single pass after the
  // concurrent checks finish. Writing inside the `Promise.all` below would let
  // the generators race on the same `index.json` (read → modify → write), so
  // only the last writer's baseline would survive.
  const baselineWrites: SourceBaselineRecord[] = []

  const updates: SourceUpdateInfo[] = await Promise.all(
    generators.map(async (gen, index) => {
      // Run plugin `config` hooks (the same step the generator pipeline performs
      // via ConfigManager/prepareConfig) so that `gen.input` is populated. Without
      // this, configs that supply the OpenAPI source through a platform plugin
      // (e.g. `swagger('petstore.json')`) leave `gen.input` empty, and the source
      // fetch resolves to the project directory itself → "Cannot find module
      // '<projectPath>'".
      const prepared = await prepareConfig(gen, projectPath)
      const output = prepared.output ?? ''
      const info: SourceUpdateInfo = { index, output, serverName: prepared.serverName, status: 'unchanged' }

      let text: string
      let resolvedInput: string
      try {
        const urls = Array.isArray(prepared.input) ? prepared.input : [prepared.input ?? '']
        const raw = await getRawSpecText(urls, {
          projectPath,
          fetchOptions: gen.fetchOptions,
        })
        text = raw.text
        resolvedInput = raw.url
      }
      catch (error: any) {
        info.status = 'error'
        info.error = error?.message ?? String(error)
        return info
      }

      const hash = computeSpecHash(text)
      info.resolvedInput = resolvedInput
      info.hash = hash

      let previous: string | undefined
      try {
        previous = (await getCacheEntry(projectPath, output))?.source?.rawHash
      }
      catch {
        previous = undefined
      }

      if (previous === undefined) {
        // First sight of this source — record the baseline, stay silent.
        info.status = 'new'
        baselineWrites.push({
          outputPath: output,
          serverName: prepared.serverName ?? '',
          source: {
            resolvedInput,
            rawHash: hash,
            updatedAt: Date.now(),
          },
        })
      }
      else if (previous !== hash) {
        info.status = 'changed'
      }
      else {
        info.status = 'unchanged'
      }

      return info
    }),
  )

  if (baselineWrites.length > 0)
    await updateSourceBaselines(projectPath, baselineWrites)

  return {
    projectPath,
    updates,
    hasChanges: updates.some(u => u.status === 'changed'),
    hasGenerationBaseline,
  }
}

export default checkUpdates
