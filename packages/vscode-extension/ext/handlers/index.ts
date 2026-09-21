import type { Publisher } from '@jsonrpc-rx/server'
import type { ExtensionContext, TextDocument } from 'vscode'
import { asBehaviorSubject, asNotify, asSubject } from '@jsonrpc-rx/server'
import { commands, env, window, workspace } from 'vscode'
import { getApiDocs } from '@/functions/getApis'
import worma from '@/helper/worma'
import { messageService } from '@/utils/message'
import { toPromise } from '@/utils/to-promise'
import { getSyntaxHighlightCss } from '@/webview/theme-colors'

export type HandlersType = ReturnType<typeof getHandlers>
export type { DataType, MessageType } from '@/utils/message'
export type { Api, ApiDoc, CacheData, Change, ChangeSummary } from 'wormajs'
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
    getThemeSyntaxColors: () => {
      return getSyntaxHighlightCss()
    },
    setTheme: (theme: string) => {
      const then = workspace
        .getConfiguration()
        .update('workbench.colorTheme', theme)
      return toPromise(then)
    },
    getLanguage() {
      return Promise.resolve(env.language)
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

    listChanges: (projectPath: string) => worma.listChanges(projectPath),
    getChange: (projectPath: string, id: string) => worma.getChange(projectPath, id),
    removeChange: async (projectPath: string, id: string) => {
      const picked = await window.showWarningMessage(
        `Delete change record ${id}?`,
        { modal: true, detail: 'The record is removed from the change history. This cannot be undone.' },
        'Delete',
      )
      if (picked !== 'Delete')
        return undefined
      const removedId = await worma.removeChange(projectPath, id)
      if (!removedId)
        void window.showWarningMessage(`Change record ${id} was not found — it may have been deleted already.`)
      return removedId
    },
  }
}
