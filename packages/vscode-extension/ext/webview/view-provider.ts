import type { HandlerConfig } from '@jsonrpc-rx/server'
import type { ExtensionContext, Webview, WebviewPanel, WebviewView } from 'vscode'
import type { WebviewOptions } from './view-helper'
import { expose, JsonrpcServer } from '@jsonrpc-rx/server'
import { WebviewHelper } from './view-helper'

export abstract class AbstractViewProvider {
  /**
   * Constructor
   * @param context the extension context, available when the extension is activated
   * @param handlers handler config from jsonrpc-rx
   * @param wiewProviderOptions related options
   */
  constructor(
    protected context: ExtensionContext,
    protected handlers: HandlerConfig,
    protected wiewProviderOptions: WebviewOptions,
  ) {}

  /**
   * Implements the webviewView logic, e.g. html assignment, communication, and webviewView option setup
   * @param webviewView an instance of vscode.WebviewView or vscode.WebviewPanel
   */
  abstract resolveWebviewView(webviewView: WebviewView | WebviewPanel): void

  /**
   * Expose handlers to the WebView, establishing communication between the extension and the webview
   * @param webview WebView
   */
  protected exposeHandlers(webview: Webview) {
    const jsonrpcServer = new JsonrpcServer(
      webview.postMessage.bind(webview),
      webview.onDidReceiveMessage.bind(webview),
    )
    expose(jsonrpcServer, this.handlers)
  }

  /**
   * Resolves the front-end app's index.html file
   * @param webview vscode.Webview, a property of vscode.WebviewView: webview
   * @returns the resolved index.html text content
   */
  protected async getWebviewHtml(webview: Webview) {
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    }
    return WebviewHelper.setupHtml(webview, this.context, this.wiewProviderOptions)
  }
}
