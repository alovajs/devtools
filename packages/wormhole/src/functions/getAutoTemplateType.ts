import type { PackageJson } from 'type-fest'
import type { FrameworkName, TemplateType } from '@/type'
import path from 'node:path'
import importFresh from 'import-fresh'

export const frameworkNames: FrameworkName[] = ['vue', 'react', 'svelte', 'solid-js', 'nuxt']

/**
 * Get the template type based on project configuration
 * @param projectPath - The project root path
 * @returns TemplateType - 'typescript' | 'module' | 'commonjs'
 */
export default function getAutoTemplateType(projectPath: string): TemplateType {
  const packageJson: PackageJson = importFresh(path.resolve(projectPath, './package.json'))
  if (packageJson?.devDependencies?.typescript) {
    return 'typescript'
  }
  return packageJson.type ?? 'module'
}

/**
 * Get the framework tag based on project dependencies
 * @param projectPath - The project root path
 * @returns FrameworkName or empty string
 */
export function getFrameworkTag(projectPath: string): FrameworkName | '' {
  const packageJson: PackageJson = importFresh(path.resolve(projectPath, './package.json'))
  if (!packageJson) {
    return ''
  }
  // Framework technology stack tag vue | react
  // Find in dependencies
  const frameTag = frameworkNames.find(framework => packageJson.dependencies?.[framework])
  // Find in dev dependencies
  // Priority: Production dependencies > Development dependencies
  const devFrameTag = frameworkNames.find(framework => packageJson.devDependencies?.[framework])
  return frameTag ?? devFrameTag ?? ''
}
