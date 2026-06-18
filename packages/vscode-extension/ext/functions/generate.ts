import type { GenerateProgress } from '@alova/wormhole'
import type Error from '@/components/error'
import { updateLoadingProgress } from '@/commands/statusBar'
import Global from '@/core/Global'
import wormhole from '@/helper/wormhole'

export interface GenerateOption {
  force?: boolean
  projectPath?: string
  showError?: boolean
  onProgress?: (snapshot: Record<string, GenerateProgress>) => void
}

export default async (option?: GenerateOption) => {
  const resultArr: Array<[string, boolean]> = []
  const errorArr: Array<Error> = []
  const { force = false, projectPath: projectPathValue, showError = false, onProgress } = option ?? {}

  const allEntries = Global.getConfigs()
  const targetEntries = projectPathValue
    ? allEntries.filter(([p]) => p === projectPathValue)
    : allEntries

  const progressSnapshots: Record<string, Record<string, GenerateProgress>> = {}

  function mergeAndReport() {
    const all: Record<string, GenerateProgress> = {}
    for (const snap of Object.values(progressSnapshots)) {
      Object.assign(all, snap)
    }
    onProgress?.(all)
    const values = Object.values(all)
    if (values.length > 0) {
      const avg = values.reduce((sum, p) => sum + p.progress, 0) / values.length
      updateLoadingProgress(avg)
    }
  }

  for (const [projectPath, config] of allEntries) {
    if (projectPathValue && projectPathValue !== projectPath) {
      continue
    }
    try {
      progressSnapshots[projectPath] = {}
      const generateResult = await wormhole.generate(config, {
        force,
        projectPath,
        onProgress(snapshot) {
          progressSnapshots[projectPath] = snapshot
          mergeAndReport()
        },
        progressInterval: 500,
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
