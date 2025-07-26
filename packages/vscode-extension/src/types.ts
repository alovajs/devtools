import type { Api, ApiDoc, HandlersType } from '@/handlers'

export type ApiType = 'project' | 'server' | 'group' | 'api'
export interface ApiProject {
  name: string
  apiDocs: ApiDoc[][]
}

export type { Api, ApiDoc, HandlersType }
export type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'TRACE'
