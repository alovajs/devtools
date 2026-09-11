export { Api, ApiDescriptor, ApiDoc, CacheData, TemplateData } from './api'
export * from '@/helper/config/type'
export type { TemplateConfigResult } from '@/helper/config/type'

/**
 * Per-generator progress event.
 *
 * Emitted by `generate()` (when `onProgress` is provided) for each
 * generator in the config, covering the full lifecycle:
 *
 *   active → progress → done/failed/skipped
 *
 * Use TypeScript's discriminated union on `phase` to narrow the event type.
 *
 * @example
 * generate(config, {
 *   onProgress(event) {
 *     switch (event.phase) {
 *       case 'active':   renderer.setActive(event.index); break
 *       case 'progress': renderer.setProgress(event.index, event.progress, event.message); break
 *       case 'done':     renderer.setDone(event.index); break
 *       case 'skipped':  renderer.setSkipped(event.index); break
 *       case 'failed':   renderer.setFailed(event.index, event.error); break
 *     }
 *   }
 * })
 */
export type GeneratorProgressEvent = {
  /** 0-based index in config.generator[] */
  index: number
} & (
  | { phase: 'active' }
  | {
    phase: 'progress'
    /** 0–100 percentage */
    progress: number
    /** Human-readable stage (e.g. 'parsing openapi document') */
    message: string
    /** Source of the progress event. `'core'` for the framework lifecycle, otherwise the plugin name. */
    source?: string
  }
  | { phase: 'done', /** The actual URL that was successfully parsed (may differ from config.input) */ resolvedInput?: string }
  | { phase: 'skipped', /** The actual URL that was successfully parsed (may differ from config.input) */ resolvedInput?: string }
  | { phase: 'failed', error: string }
)

/** Id and aggregated row counts of a change record persisted by one `generate()` run. */
export interface RecordedChangeInfo {
  /** Zero-padded record id, e.g. `"0007"` */
  id: string
  added: number
  removed: number
  modified: number
}

export interface GenerateApiOptions {
  projectPath?: string
  /** Per-generator lifecycle callback. Receives a discriminated union of {@link GeneratorProgressEvent}. */
  onProgress?: (event: GeneratorProgressEvent) => void
  /**
   * Called once when this run persisted a change record, with its id and
   * aggregated counts. Never called when the source document did not change,
   * so callers can tell "source updated" apart from "nothing to record".
   */
  onChangeRecorded?: (change: RecordedChangeInfo) => void
}
