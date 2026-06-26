import type { Api, ApiDoc, CacheData, HandlersType } from '#/handlers'

export type ApiType = 'project' | 'server' | 'group' | 'api'
export interface ApiProject {
  name: string
  servers: CacheData[]
}

export interface ApiWithSource extends Api {
  /** 服务器显示名称 */
  serverName: string
  /** 服务器路径 (e.g. "https://petstore.swagger.io/v2") */
  serverPath: string
  /** 项目名称 */
  projectName: string
  /** 服务器在项目中的索引 */
  serverIndex: number
}

/** CodeLens 命令参数中传递的 API 引用，用于精确路由到树节点 */
export interface ApiRef {
  /** 树节点唯一标识，格式: projectName/serverIndex/global.name */
  uniqueKey: string
  serverName: string
  serverPath: string
  method: string
  path: string
  summary: string
  /** 代码中的匹配键，如 ".addPet" */
  targetKey: string
}

export type { Api, ApiDoc, CacheData, HandlersType }
export type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'TRACE' | 'HEAD' | 'OPTIONS'
