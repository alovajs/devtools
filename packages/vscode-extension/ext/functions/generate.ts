import type { GeneratorProgressEvent } from '@alova/wormhole'
import type Error from '@/components/error'
import { updateLoadingProgress } from '@/commands/statusBar'
import Global from '@/core/Global'
import wormhole from '@/helper/wormhole'

export interface GenerateOption {
  force?: boolean
  projectPath?: string
  showError?: boolean
  onProgress?: (event: GeneratorProgressEvent) => void
}

export default async (option?: GenerateOption) => {
  const resultArr: Array<[string, boolean]> = []
  const errorArr: Array<Error> = []
  const { force = false, projectPath: projectPathValue, showError = false, onProgress } = option ?? {}

  const allEntries = Global.getConfigs()
  const targetEntries = projectPathValue
    ? allEntries.filter(([p]) => p === projectPathValue)
    : allEntries

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
    try {
      progressMap.set(projectPath, new Map())
      const generateResult = await wormhole.generate(config, {
        force,
        projectPath,
        onProgress(event) {
          const genMap = progressMap.get(projectPath)!
          if (event.phase === 'progress') {
            genMap.set(event.index, event.progress)
          } else if (event.phase === 'done' || event.phase === 'skipped') {
            genMap.set(event.index, 100)
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
  }
}
