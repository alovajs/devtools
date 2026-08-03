import type { Api, ApiDoc, CacheData, HandlersType } from '#/handlers'

export type ApiType = 'project' | 'server' | 'group' | 'api'
export interface ApiProject {
  name: string
  servers: CacheData[]
}

export interface ApiWithSource extends Api {
  /** Display name of the server */
  serverName: string
  /** Server path (e.g. "https://petstore.swagger.io/v2") */
  serverPath: string
  /** Project name */
  projectName: string
  /** Index of the server within the project */
  serverIndex: number
}

/** API reference passed in CodeLens command args, used to route precisely to the tree node */
export interface ApiRef {
  /** Unique identifier of the tree node, format: projectName/serverIndex/global.name */
  uniqueKey: string
  serverName: string
  serverPath: string
  method: string
  path: string
  summary: string
  /** Match key in code, e.g. ".addPet" */
  targetKey: string
}

export type { Api, ApiDoc, CacheData, HandlersType }
export type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'TRACE' | 'HEAD' | 'OPTIONS'
