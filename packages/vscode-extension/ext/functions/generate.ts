import type { GeneratorProgressEvent } from 'wormajs'
import { updateLoadingProgress } from '@/commands/statusBar'
import Error from '@/components/error'
import Global from '@/core/Global'
import worma from '@/helper/worma'
import { withProjectCwd } from '@/utils/cwd'

/** Aggregated API-diff counts produced by one `generate()` run. */
export interface GenerateChangeSummary {
  added: number
  removed: number
  modified: number
  /** Id of the newest change record written by this run — used to deep-link into the API Changes view. */
  id: string
}

export interface GenerateOption {
  projectPath?: string
  showError?: boolean
  onProgress?: (event: GeneratorProgressEvent) => void
}

export interface ProjectStats {
  done: number
  skipped: number
  failed: number
  /** Resolved input URLs for done + skipped generators */
  resolvedInputs: string[]
  /** Error messages for failed generators */
  failedErrors: string[]
}

export default async (option?: GenerateOption) => {
  const resultArr: Array<[string, boolean]> = []
  const errorArr: Array<Error> = []
  const projectStatsMap = new Map<string, ProjectStats>()
  /** Change record written by this run, per project — reported by `generate()`. */
  const changeSummary: Record<string, GenerateChangeSummary> = {}
  const { projectPath: projectPathValue, showError = false, onProgress } = option ?? {}

  const allEntries = Global.getConfigs()

  // Per-project per-generator progress tracking
  const progressMap = new Map<string, Map<number, number>>()
  function mergeAndReport() {
    let total = 0
    let count = 0
    for (const genMap of progressMap.values()) {
      for (const p of genMap.values()) {
        total += p
        count++
      }
    }
    if (count > 0) {
      updateLoadingProgress(total / count)
    }
  }

  for (const [projectPath, config] of allEntries) {
    if (projectPathValue && projectPathValue !== projectPath) {
      continue
    }

    const stats: ProjectStats = {
      done: 0,
      skipped: 0,
      failed: 0,
      resolvedInputs: [],
      failedErrors: [],
    }
    projectStatsMap.set(projectPath, stats)

    try {
      progressMap.set(projectPath, new Map())
      // run inside the project context: `process.cwd()` in the extension host points
      // to the VS Code installation dir, which breaks relative paths in custom plugins
      const generateResult = await withProjectCwd(projectPath, () => worma.generate(config, {
        projectPath,
        onProgress(event) {
          const genMap = progressMap.get(projectPath)!
          if (event.phase === 'active') {
            genMap.set(event.index, 0)
          }
          else if (event.phase === 'progress') {
            genMap.set(event.index, event.progress)
          }
          else if (event.phase === 'done') {
            genMap.set(event.index, 100)
            stats.done++
            if (event.resolvedInput)
              stats.resolvedInputs.push(event.resolvedInput)
          }
          else if (event.phase === 'skipped') {
            genMap.set(event.index, 100)
            stats.skipped++
            if (event.resolvedInput)
              stats.resolvedInputs.push(event.resolvedInput)
          }
          else if (event.phase === 'failed') {
            stats.failed++
            stats.failedErrors.push(event.error)
            // feed generator failures into the regular error pipeline too, otherwise
            // a failed generator is only visible in the output channel and no
            // notification pops up (the generate() promise itself resolves)
            const isFirstOccurrence = stats.failedErrors.indexOf(event.error) === stats.failedErrors.length - 1
            if (isFirstOccurrence) {
              const error = new Error(event.error)
              error.setPath(projectPath)
              errorArr.push(error)
            }
          }
          onProgress?.(event)
          mergeAndReport()
        },
        onChangeRecorded(change) {
          // Reported by `generate()` itself once the record is persisted, so no
          // post-run scan (and no `createdAt` heuristic) is needed.
          changeSummary[projectPath] = {
            id: change.id,
            added: change.added,
            removed: change.removed,
            modified: change.modified,
          }
        },
      }))
      resultArr.push([projectPath, generateResult?.some(item => !!item)])
    }
    catch (err) {
      const error = err as Error
      error?.setPath?.(projectPath)
      errorArr.push(error)
    }
  }
  if (showError && errorArr.length > 0) {
    errorArr.forEach((error) => {
      throw error
    })
  }

  // `changeSummary` is filled by the `onChangeRecorded` callback above: a record
  // only exists when the source document actually changed, which is exactly the
  // signal the caller needs to offer a "View Changes" affordance.
  return {
    resultArr,
    errorArr,
    projectStats: projectStatsMap,
    changeSummary,
  }
}
