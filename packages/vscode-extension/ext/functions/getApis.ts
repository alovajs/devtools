import type { Api, CacheData } from 'worma'
import type { ApiWithSource } from '~/types'
import path from 'node:path'
import Global from '@/core/Global'
import worma from '@/helper/worma'
import { getFileNameByPath } from '@/utils'

export async function getApis(filePath: string) {
  // Find the deepest matching project config (longest path match first) to correctly
  // identify the sub-package in a monorepo setup.
  const matched = Global.getConfigs()
    .filter(([projectPath]) => {
      const resolved = path.resolve(projectPath)
      return filePath.includes(resolved + path.sep) || filePath === resolved
    })
    // Sort by path length descending so nested packages take precedence
    .sort(([a], [b]) => path.resolve(b).length - path.resolve(a).length)
  const [projectPath, config] = matched[0] ?? []
  if (!config) {
    return []
  }
  const outputs = config.generator.map(g => g.output).filter((o): o is string => !!o)
  const cacheList = await worma.getApiDocs(outputs, projectPath)
  return cacheList.flatMap((cd: CacheData) => cd.apis)
}

export async function getApisWithContext(filePath: string): Promise<ApiWithSource[]> {
  const matched = Global.getConfigs()
    .filter(([projectPath]) => {
      const resolved = path.resolve(projectPath)
      return filePath.includes(resolved + path.sep) || filePath === resolved
    })
    .sort(([a], [b]) => path.resolve(b).length - path.resolve(a).length)
  const [projectPath, config] = matched[0] ?? []
  if (!config) {
    return []
  }
  const outputs = config.generator.map(g => g.output).filter((o): o is string => !!o)
  const cacheList = await worma.getApiDocs(outputs, projectPath)
  const projectName = getFileNameByPath(projectPath)

  return cacheList.flatMap((cd: CacheData, idx: number) =>
    cd.apis.map(api => ({
      ...api,
      serverName: cd.serverName || getFileNameByPath(cd.path),
      serverPath: cd.path,
      projectName,
      serverIndex: idx,
    })),
  )
}

export async function getApiDocs() {
  const configs = Global.getConfigs()
  if (configs.length === 0) {
    return []
  }

  // Single project: use filtered outputs for precise reads
  if (configs.length === 1) {
    const [projectPath, config] = configs[0]
    const outputs = config.generator.map(g => g.output).filter((o): o is string => !!o)
    const servers = await worma.getApiDocs(outputs, projectPath)
    return [{ name: getFileNameByPath(projectPath), servers }]
  }

  // Monorepo: read ALL entries from the unified cache once (no output filter),
  // then group by sub-project. One ApiProject per sub-project ensures tree node
  // IDs naturally match CodeLens keys (both use subProjectName/serverIndex/apiName).
  const [firstPath] = configs[0]
  const allServers = await worma.getApiDocs(undefined, firstPath)

  // Build lookup: config directory basename → display name
  const subMap = new Map<string, string>()
  for (const [p] of configs) {
    const resolved = path.resolve(p)
    subMap.set(path.basename(resolved), getFileNameByPath(p))
  }

  // Group servers by sub-project
  const grouped = new Map<string, CacheData[]>()
  for (const server of allServers) {
    const segments = server.path.replace(/\\/g, '/').split('/')
    let matched = false
    for (const seg of segments) {
      const subName = subMap.get(seg)
      if (subName) {
        const list = grouped.get(subName) || []
        list.push(server)
        grouped.set(subName, list)
        matched = true
        break
      }
    }
    // Unmatched servers (from other monorepo members without config) get their
    // own project entry via their path's first meaningful segment
    if (!matched) {
      const seg0 = segments[0]
      if (seg0) {
        const list = grouped.get(seg0) || []
        list.push(server)
        grouped.set(seg0, list)
      }
    }
  }

  const results: { name: string, servers: CacheData[] }[] = []
  for (const [subName, servers] of grouped) {
    results.push({ name: subName, servers })
  }
  return results
}

export async function isApiExists(api: Api | null) {
  if (!api) {
    return false
  }
  const apiProjects = await getApiDocs()
  const apis = apiProjects.flatMap(item => item.servers.flatMap((cd: CacheData) => cd.apis))
  return apis.some(item => item.name === api.name)
}
