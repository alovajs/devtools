import path from 'node:path'
import Global from '@/core/Global'
import wormhole from '@/helper/wormhole'
import { getFileNameByPath } from '@/utils'

export default async (filePath: string) => {
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
