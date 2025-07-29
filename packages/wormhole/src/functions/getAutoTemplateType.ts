import type { PackageJson } from 'type-fest'
import type { TemplateType } from '@/type'
import path from 'node:path'
import importFresh from 'import-fresh'

export default (projectPath: string): TemplateType => {
  const packageJson: PackageJson = importFresh(path.resolve(projectPath, './package.json'))
  if (packageJson?.devDependencies?.typescript) {
    return 'typescript'
  }
  return packageJson.type ?? 'module'
}
