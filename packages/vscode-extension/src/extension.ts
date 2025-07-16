import * as vscode from 'vscode'
import apiDocs from '@/components/apiDocs'
import codeSnippet from '@/components/codeSnippet'
import Global from '@/core/Global'
import { Log } from '@/utils'
import { version } from '../package.json'
import commandsModules, { Commands } from './commands'
import { getHandlers } from './handlers'
import { ViewProviderSidebar } from './webview/view-provider-sidebar'

export async function activate(ctx: vscode.ExtensionContext) {
  Log.info(`🈶 Activated, v${version}`)
  // commands registration
  Global.init(ctx)
  apiDocs.activate(ctx)
  codeSnippet.activate(ctx)
  const handlers = getHandlers(ctx)
  const viewProvidersidebar = new ViewProviderSidebar(ctx, handlers)
  // 注册 Sidebar
  const sidebarViewDisposable = vscode.window.registerWebviewViewProvider('sidebar-view-container', viewProvidersidebar, {
    webviewOptions: { retainContextWhenHidden: true },
  })
  const modules = [commandsModules]
  const disposables = modules.map(m => m(ctx)).flat()
  disposables.forEach(d => ctx.subscriptions.push(d))
  ctx.subscriptions.push(sidebarViewDisposable)
  vscode.commands.executeCommand(Commands.show_status_bar_icon)
  await Global.setup()
}

export function deactivate() {
  Log.info('🈚 Deactivated')
}
