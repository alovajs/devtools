import type { Api, ApiDoc, CacheData, HandlersType } from '#/handlers'

export type ApiType = 'project' | 'server' | 'group' | 'api'
export interface ApiProject {
  name: string
  servers: CacheData[]
}

export type { Api, ApiDoc, CacheData, HandlersType }
export type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'TRACE' | 'HEAD' | 'OPTIONS'
