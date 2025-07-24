import type { Publisher } from '@jsonrpc-rx/server'
import type { ExtensionContext, TextDocument } from 'vscode'
import { asBehaviorSubject, asNotify, asSubject } from '@jsonrpc-rx/server'
import { commands, window, workspace } from 'vscode'
import { getApiDocs } from '@/functions/getApis'
import { messageService } from '@/utils/message'
import { toPromise } from '@/utils/to-promise'

export type HandlersType = ReturnType<typeof getHandlers>
export type { DataType, MessageType } from '@/utils/message'
export type { Api, ApiDoc } from '@alova/wormhole'
export type ApiProject = Awaited<ReturnType<typeof getApiDocs>>[number]

export function getHandlers(context: ExtensionContext) {
  return {
    showInformation: asNotify((message: string) => {
      window.showInformationMessage(message)
    }),

    getApiDocs: (): Promise<ApiProject[]> => {
      return getApiDocs()
    },
    getTheme: () => {
      return workspace.getConfiguration().get('workbench.colorTheme') as string
    },
    setTheme: (theme: string) => {
      const then = workspace
        .getConfiguration()
        .update('workbench.colorTheme', theme)
      return toPromise(then)
    },
    onThemeChange: asBehaviorSubject(({ next }) => {
      const disposable = workspace.onDidChangeConfiguration(() => {
        const colorTheme = workspace
          .getConfiguration()
          .get('workbench.colorTheme')
        next(colorTheme)
      })
      context.subscriptions.push(disposable)
      return disposable.dispose.bind(disposable)
    }, workspace.getConfiguration().get('workbench.colorTheme')),

    registerChannel: (channel: string) => {
      messageService.register(channel)
    },
    unregisterChannel: (channel: string) => {
      return messageService.unregister(channel)
    },
    sendMessage: (channel: string, message: any) => {
      return messageService.sendMessage(channel, message)
    },
    addMessageListener(channel: string, listener: (msg: any) => void) {
      return messageService.addMessageListener(channel, listener)
    },
    readyMessageListener(channel: string, listenerNumber: number) {
      return messageService.readyMessageListener(channel, listenerNumber)
    },
    rmMessageListener(channel: string, listenerNumber: number) {
      return messageService.rmMessageListener(channel, listenerNumber)
    },
    execCommand: (command: string, ...rest: any[]) => {
      const then = commands.executeCommand(command, ...rest)
      return toPromise(then)
    },
    onDidOpenTextDocument: asSubject(({ next }: Publisher<TextDocument>) => {
      const disposable = workspace.onDidOpenTextDocument(file => next(file))
      return disposable.dispose.bind(disposable)
    }),
  }
}
