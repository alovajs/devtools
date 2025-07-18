import type { ExtensionContext } from 'vscode'
import { commands, window } from 'vscode'
import commandsModules, { Commands } from '@/commands'
import apiDocs from '@/components/apiDocs'
import codeSnippet from '@/components/codeSnippet'
import { registerEvent } from '@/components/event'
import { getWormhole } from '@/functions/getWormhole'
import { getHandlers } from '@/handlers'
import { Log } from '@/utils'
import { ViewProviderSidebar } from '@/webview/view-provider-sidebar'
import ApiGenerate from './ApiGenerate'

export default class Setup {
  static async init(ctx: ExtensionContext) {
    Log.info('🚀 Setup start')
    apiDocs.activate(ctx)
    codeSnippet.activate(ctx)
    const handlers = getHandlers(ctx)
    const viewProvidersidebar = new ViewProviderSidebar(ctx, handlers)
    // 注册 Sidebar
    const sidebarViewDisposable = window.registerWebviewViewProvider('sidebar-view-container', viewProvidersidebar, {
      webviewOptions: { retainContextWhenHidden: true },
    })
    const modules = [commandsModules]
    const disposables = modules.map(m => m(ctx)).flat()
    disposables.forEach(d => ctx.subscriptions.push(d))
    ctx.subscriptions.push(sidebarViewDisposable)
    commands.executeCommand(Commands.show_status_bar_icon)
    registerEvent()
    if (getWormhole()) {
      await ApiGenerate.onlyReadConfig()
    }
    Log.info('🚀 Setup end')
  }
}
