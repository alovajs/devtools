import type { HandlerConfig } from '@jsonrpc-rx/server'
import type { ExtensionContext, Webview, WebviewPanel, WebviewView } from 'vscode'
import type { WebviewOptions } from './view-helper'
import { expose, JsonrpcServer } from '@jsonrpc-rx/server'
import { WebviewHelper } from './view-helper'

export abstract class AbstractViewProvider {
  /**
   * 构造方法
   * @param context 该插件的上下文，在插件激活时可以获取
   * @param handlers jsonrpc-rx 中的处理逻辑的配置
   * @param wiewProviderOptions 相关配置
   */
  constructor(
    protected context: ExtensionContext,
    protected handlers: HandlerConfig,
    protected wiewProviderOptions: WebviewOptions,
  ) {}

  /**
   * 用于实现 webviewView 的处理逻辑，例如：html 赋值、通讯、设置 webviewView 参数等
   * @param webviewView 可以为 vscode.WebviewView 或者 vscode.WebviewPanel 的实例
   */
  abstract resolveWebviewView(webviewView: WebviewView | WebviewPanel): void

  /**
   * “暴露” handles 给 WebView。建立 extenson 和 webview 之间的通讯
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
   * 处理前端应用 index.html 文件的方法
   * @param webview vscode.Webview 类型，指向 vscode.WebviewView 的一个属性：webview
   * @returns 处理好的 index.html 文本内容
   */
  protected async getWebviewHtml(webview: Webview) {
    webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    }
    return WebviewHelper.setupHtml(webview, this.context, this.wiewProviderOptions)
  }
}
