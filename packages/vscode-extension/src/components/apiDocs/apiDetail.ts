import TemplateEngine from '@/templateEngine';
import type { Api } from '@alova/wormhole';
import * as vscode from 'vscode';
import { commandMap } from './command';

export class ApiDetailProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _isWebviewReady = false;
  private _pendingUpdates: any[] = [];
  private _onWebViewReady = new vscode.EventEmitter<ApiDetailProvider>();
  readonly onWebViewReady = this._onWebViewReady.event;
  constructor(private context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri]
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    // 处理来自Webview的消息
    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.type) {
        case 'webview-ready': {
          this._isWebviewReady = true;
          // 处理所有等待中的更新
          this._pendingUpdates.forEach(update => {
            this._view?.webview.postMessage(update);
          });
          this._pendingUpdates = [];
          this._onWebViewReady.fire(this);
          break;
        }
        case 'refresh': {
          vscode.commands.executeCommand(commandMap.refresh.commandId);
          break;
        }
        default: {
          break;
        }
      }
    });
  }

  updateView(api?: Api) {
    const message = {
      type: 'updateData',
      data: api
    };
    if (this._isWebviewReady) {
      // Webview 已就绪，直接发送消息
      this._view?.webview.postMessage(message);
    } else {
      // Webview 尚未就绪，存储消息等待发送
      this._pendingUpdates.push(message);
    }
  }
  private getHtml(webview: vscode.Webview): string {
    // 使用模板引擎渲染
    return TemplateEngine.renderTemplate(this.context, 'templates/api-detail.html', {
      loadingMessage: 'Loading data...',
      styleUri: TemplateEngine.getWebviewResourceUri(webview, this.context, 'media/api-detail.css')
    });
  }
}

export default ApiDetailProvider;
