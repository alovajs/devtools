import type { PackageJson } from 'type-fest'
import fs from 'node:fs/promises'
import path from 'node:path'

/** In-memory cache: projectPath → parsed package.json. Valid for the lifetime of one generate run. */
const pkgCache = new Map<string, PackageJson | null>()

/**
 * Read and cache package.json for a given project directory.
 * Returns null if the file doesn't exist or can't be parsed.
 */
export async function readPackageJson(projectPath: string): Promise<PackageJson | null> {
  const cached = pkgCache.get(projectPath)
  if (cached !== undefined)
    return cached

  try {
    const pkgPath = path.resolve(projectPath, 'package.json')
    const content = await fs.readFile(pkgPath, 'utf-8')
    const pkg = JSON.parse(content) as PackageJson
    pkgCache.set(projectPath, pkg)
    return pkg
  }
  catch {
    pkgCache.set(projectPath, null)
    return null
  }
}

/** Clear the in-memory cache (useful for testing). */
export function clearPackageJsonCache() {
  pkgCache.clear()
}
