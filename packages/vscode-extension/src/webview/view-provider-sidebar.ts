import type { HandlerConfig } from '@jsonrpc-rx/server'
import type { ExtensionContext, WebviewView, WebviewViewProvider } from 'vscode'
import { AbstractViewProvider } from './view-provider-abstract'

export class ViewProviderSidebar extends AbstractViewProvider implements WebviewViewProvider {
  constructor(context: ExtensionContext, handlers: HandlerConfig) {
    super(context, handlers, {
      distDir: 'sidebar-out',
      indexPath: 'sidebar-out/index.html',
    })
  }

  async resolveWebviewView(webviewView: WebviewView) {
    const { webview } = webviewView
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    }
    this.exposeHandlers(webview)
    webview.html = await this.getWebviewHtml(webview)
  }
}
