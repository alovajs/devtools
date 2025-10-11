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
  requestComment?: string
  name: string
  global: string
  responseName: string
  requestName?: string
  defaultValue?: string
  pathKey: string
}
export interface ApiDoc {
  apis: Api[]
  tag: string
}
declare function getApiDocs(): Promise<{
  name: string
  apiDocs: ApiDoc[][]
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
