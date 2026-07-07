import type { GenerateProgress, ReportProgress } from '@/helper/config/type'

export type ProgressListener = (snapshot: Record<string, GenerateProgress>) => void

export const CORE_PROGRESS_SOURCE = 'core'

/**
 * Named stages for the generator lifecycle.
 * These are used by the CLI renderer to display human-readable progress stages.
 */
export const GeneratorStage = {
  INIT: 'init',
  BEFORE_OPENAPI_PARSE: 'beforeOpenapiParse',
  PARSE_OPENAPI: 'parseOpenapi',
  OPENAPI_PARSED: 'openapiParsed',
  TEMPLATE_LOADED: 'templateLoaded',
  TEMPLATE_DATA_PARSED: 'templateDataParsed',
  BEFORE_CODE_GENERATE: 'beforeCodeGenerate',
  PROCESS_TEMPLATES: 'processTemplates',
  WRITE_FILES: 'writeFiles',
  CODE_GENERATED: 'codeGenerated',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
} as const

// eslint-disable-next-line ts/no-redeclare
export type GeneratorStage = (typeof GeneratorStage)[keyof typeof GeneratorStage]

export class ProgressTracker {
  private snapshot: Record<string, GenerateProgress> = {}
  private dirty = false
  private timer: NodeJS.Timeout | null = null
  private readonly listener?: ProgressListener
  private readonly interval: number

  constructor(listener?: ProgressListener, interval = 500) {
    this.listener = listener
    this.interval = interval
  }

  start(): void {
    if (!this.listener || this.timer || this.interval <= 0) {
      return
    }
    this.timer = setInterval(() => this.flush(), this.interval)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.flush()
  }

  update(source: string, progress: number, message?: string): void {
    const clamped = Math.max(0, Math.min(100, progress))
    this.snapshot[source] = { source, progress: clamped, message }
    this.dirty = true
    if (this.listener && this.interval <= 0) {
      this.flush()
    }
  }

  flush(): void {
    if (!this.dirty || !this.listener) {
      return
    }
    this.dirty = false
    this.listener({ ...this.snapshot })
  }

  reporterFor(source: string): ReportProgress {
    return (progress: number, message?: string) => this.update(source, progress, message)
  }
}

export const noopReportProgress: ReportProgress = () => {}
