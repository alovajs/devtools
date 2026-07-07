import type { GeneratorProgressEvent } from 'wormajs'
import type Error from '@/components/error'
import { updateLoadingProgress } from '@/commands/statusBar'
import Global from '@/core/Global'
import worma from '@/helper/worma'

export interface GenerateOption {
  force?: boolean
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
  const { force = false, projectPath: projectPathValue, showError = false, onProgress } = option ?? {}

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
      const generateResult = await worma.generate(config, {
        force,
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
          }
          onProgress?.(event)
          mergeAndReport()
        },
      })
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
  return {
    resultArr,
    errorArr,
    projectStats: projectStatsMap,
  }
}
