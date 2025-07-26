import type { HandlerConfig } from '@jsonrpc-rx/server'
import type { ExtensionContext, WebviewView, WebviewViewProvider } from 'vscode'
import { window } from 'vscode'
import { getHandlers } from '@/handlers'
import { AbstractViewProvider } from '@/webview/view-provider'

export class ViewApiDetailProvider extends AbstractViewProvider implements WebviewViewProvider {
  constructor(context: ExtensionContext, handlers: HandlerConfig) {
    super(context, handlers, {
      path: '/api-detail',
    })
  }

  async resolveWebviewView(webviewView: WebviewView) {
    const { webview } = webviewView
    this.exposeHandlers(webview)
    webview.html = await this.getWebviewHtml(webview)
  }
}

export default <ExtensionModule> function (ctx) {
  const handlers = getHandlers(ctx)
  const viewProvidersidebar = new ViewApiDetailProvider(ctx, handlers)
  return window.registerWebviewViewProvider('api-docs-detail-view', viewProvidersidebar, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
  })
}
