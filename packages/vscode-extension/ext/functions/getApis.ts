import type { Api } from '@alova/wormhole'
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
  const apiDocs = await wormhole.getApiDocs(config, projectPath)
  return apiDocs.flatMap(apiDoc => apiDoc.flatMap(item => item.apis))
}
export async function getApiDocs() {
  return Promise.all(
    Global.getConfigs().map(async ([projectPath, config]) => ({
      name: getFileNameByPath(projectPath),
      apiDocs: await wormhole.getApiDocs(config, projectPath),
    })),
  )
}

export async function isApiExists(api: Api | null) {
  if (!api) {
    return false
  }
  const apiProjects = await getApiDocs()
  const apis = apiProjects.flatMap(item => item.apiDocs.flatMap(item => item.flatMap(item => item.apis)))
  return apis.some(item => item.global === api.global && item.pathKey === api.pathKey)
}
