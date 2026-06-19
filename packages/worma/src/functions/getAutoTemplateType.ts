import type { FrameworkName, TemplateType } from '@/type'
import { FRAMEWORK_NAMES, TemplateTypeEnum } from '@/constant'
import { readPackageJson } from '@/utils/readPackageJson'

/**
 * Get the template type based on project configuration
 * @param projectPath - The project root path
 * @returns TemplateType - 'typescript' | 'module' | 'commonjs'
 */
export default async function getAutoTemplateType(projectPath: string): Promise<TemplateType> {
  const packageJson = await readPackageJson(projectPath)
  if (packageJson?.devDependencies?.typescript) {
    return TemplateTypeEnum.TYPESCRIPT
  }
  const type = packageJson?.type as TemplateType | undefined
  return type ?? TemplateTypeEnum.MODULE
}

/**
 * Get the framework tag based on project dependencies
 * @param projectPath - The project root path
 * @returns FrameworkName or empty string
 */
export async function getFrameworkTag(projectPath: string): Promise<FrameworkName | ''> {
  const packageJson = await readPackageJson(projectPath)
  if (!packageJson) {
    return ''
  }
  // Framework technology stack tag vue | react
  // Find in dependencies
  const frameTag = FRAMEWORK_NAMES.find(framework => packageJson.dependencies?.[framework]) as FrameworkName | undefined
  // Find in dev dependencies
  // Priority: Production dependencies > Development dependencies
  const devFrameTag = FRAMEWORK_NAMES.find(framework => packageJson.devDependencies?.[framework]) as FrameworkName | undefined
  return frameTag ?? devFrameTag ?? ''
}
