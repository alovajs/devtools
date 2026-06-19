import { FRAMEWORK_NAMES } from '@/constant'
import { readPackageJson } from '@/utils/readPackageJson'

export default async function (projectPath: string) {
  const packageJson = await readPackageJson(projectPath)
  if (!packageJson) {
    return ''
  }
  // Framework technology stack tag vue | react
  // Find in dependencies
  const frameTag = FRAMEWORK_NAMES.find(framework => packageJson.dependencies?.[framework])
  // Find in dev dependencies
  // Priority: Production dependencies > Development dependencies
  const devFrameTag = FRAMEWORK_NAMES.find(framework => packageJson.devDependencies?.[framework])
  return frameTag ?? devFrameTag ?? ''
}
