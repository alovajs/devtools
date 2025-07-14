import type { PackageJson } from 'type-fest'
import type { AlovaVersion } from '@/type'
import path from 'node:path'
import importFresh from 'import-fresh'

export default function (projectPath: string) {
  const packageJson: PackageJson = importFresh(path.resolve(projectPath, './package.json'))
  if (!packageJson) {
    return 'v3'
  }
  // Find in dependencies
  const alovaVersion = packageJson.dependencies?.alova
  // Find in dev dependencies
  // Priority: Production dependencies > Development dependencies
  const alovaDevVersion = packageJson.devDependencies?.alova
  // Framework technology stack tag vue | react
  return getVersion(alovaVersion ?? alovaDevVersion)
}

export function getVersion(version?: string): AlovaVersion {
  const execArr = /(\d+)\./.exec(version ?? '') ?? []
  return `v${Number(execArr[1]) || 3}`
}
