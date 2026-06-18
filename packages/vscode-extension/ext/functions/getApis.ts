import type { Api, CacheData } from '@alova/wormhole'
import path from 'node:path'
import Global from '@/core/Global'
import wormhole from '@/helper/wormhole'
import { getFileNameByPath } from '@/utils'

export async function getApis(filePath: string) {
  const [projectPath, config]
    = Global.getConfigs().find(([projectPath]) => filePath.includes(path.resolve(projectPath))) ?? []
  if (!config) {
    return []
  }
  const cacheList = await wormhole.getApiDocs(config, projectPath)
  return cacheList.flatMap((cd: CacheData) => cd.apis)
}

export async function getApiDocs() {
  return Promise.all(
    Global.getConfigs().map(async ([projectPath, config]) => ({
      name: getFileNameByPath(projectPath),
      servers: await wormhole.getApiDocs(config, projectPath) as CacheData[],
    })),
  )
}

export async function isApiExists(api: Api | null) {
  if (!api) {
    return false
  }
  const apiProjects = await getApiDocs()
  const apis = apiProjects.flatMap(item => item.servers.flatMap((cd: CacheData) => cd.apis))
  return apis.some(item => item.global === api.global && item.pathKey === api.pathKey)
}
