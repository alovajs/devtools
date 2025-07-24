import type Error from '@/components/error'
import Global from '@/core/Global'
import wormhole from '@/helper/wormhole'

export interface GenerateOption {
  force?: boolean
  projectPath?: string
  showError?: boolean
}
export default async (option?: GenerateOption) => {
  const resultArr: Array<[string, boolean]> = []
  const errorArr: Array<Error> = []
  const { force = false, projectPath: projectPathValue, showError = false } = option ?? {}
  for (const [projectPath, config] of Global.getConfigs()) {
    if (projectPathValue && projectPathValue !== projectPath) {
      continue
    }
    try {
      const generateResult = await wormhole.generate(config, {
        force,
        projectPath,
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
