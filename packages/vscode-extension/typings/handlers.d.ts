import type { Publisher } from '@jsonrpc-rx/server'
import type { ExtensionContext, TextDocument } from 'vscode'

export interface Api {
  tag: string
  method: string
  summary: string
  path: string
  pathParameters: string
  queryParameters: string
  pathParametersComment?: string
  queryParametersComment?: string
  responseComment?: string
  requestBodyComment?: string
  name: string
  response: string
  requestBody?: string
  callingCode?: string
}
export interface ApiDoc {
  apis: Api[]
  tagName: string
}
/**
 * Standardized cache data for VSCode extension
 * Used for rendering sidebar API tree and quick search
 */
export interface CacheData {
  path: string
  /** Server name displayed in sidebar */
  serverName?: string
  /** All APIs as a flat array */
  apis: Api[]
}
declare function getApiDocs(): Promise<{
  name: string
  servers: CacheData[]
}[]>
export interface DataType<T = any> {
  type: string
  data: T
}
export interface MessageType<T = any> {
  from?: string
  value?: DataType<T>
}
export type HandlersType = ReturnType<typeof getHandlers>
export type ApiProject = Awaited<ReturnType<typeof getApiDocs>>[number]
export declare function getHandlers(context: ExtensionContext): {
  showInformation: import('@jsonrpc-rx/server').Notifiable<(message: string) => void>
  getApiDocs: () => Promise<ApiProject[]>
  getTheme: () => string
  getThemeSyntaxColors: () => string
  setTheme: (theme: string) => Promise<void>
  getLanguage: () => Promise<string>
  onThemeChange: import('@jsonrpc-rx/server').Observable<({ next }: Publisher<any>) => () => any>
  registerChannel: (channel: string) => void
  unregisterChannel: (channel: string) => boolean
  sendMessage: (channel: string, message: any) => Promise<string | void>
  addMessageListener: (channel: string, listener: (msg: any) => void) => Promise<number>
  readyMessageListener: (channel: string, listenerNumber: number) => Promise<void>
  rmMessageListener: (channel: string, listenerNumber: number) => boolean
  execCommand: (command: string, ...rest: any[]) => Promise<unknown>
  onDidOpenTextDocument: import('@jsonrpc-rx/server').Observable<({ next }: Publisher<TextDocument>) => () => any>
}

export {}
