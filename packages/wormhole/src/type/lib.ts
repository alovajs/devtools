import type { GenerateProgress } from '@/helper/config/type'

export { Api, ApiDescriptor, ApiDoc, CacheData, TemplateData } from './api'
export * from '@/helper/config/type'
export type { TemplateConfigResult } from '@/helper/config/type'

export interface GenerateApiOptions {
  force?: boolean
  projectPath?: string
  /**
   * Receive throttled progress snapshots while generation is running.
   * The snapshot maps each progress source (the literal `'core'` for the framework lifecycle,
   * or a plugin's `name`) to its latest reported progress.
   */
  onProgress?: (snapshot: Record<string, GenerateProgress>) => void
  /**
   * Throttle interval in milliseconds for `onProgress`. Defaults to `500`.
   * Values <= 0 disable throttling and emit on every update.
   */
  progressInterval?: number
}
