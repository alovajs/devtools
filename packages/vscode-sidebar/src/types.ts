import type { Api, ApiDoc, HandlersType } from 'alova-vscode-extension/handlers'
import type { ViteSSGContext } from 'vite-ssg'

export type UserModule = (ctx: ViteSSGContext) => void
export type ApiType = 'project' | 'server' | 'group' | 'api'
export interface ApiProject {
  name: string
  apiDocs: ApiDoc[][]
}

export type { Api, ApiDoc, HandlersType }
