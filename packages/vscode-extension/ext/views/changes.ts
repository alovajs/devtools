import type { HandlerConfig } from '@jsonrpc-rx/server'
import type { ExtensionContext, Webview, WebviewPanel, WebviewView } from 'vscode'
import type { WebviewOptions } from '@/webview/view-helper'
import qs from 'query-string'
import { ViewColumn, window } from 'vscode'
import { displayName } from '@/meta'
import { getWorkspacePaths } from '@/utils/vscode'
import { AbstractViewProvider } from '@/webview/view-provider'

/** Alias accepted by `worma.getChange` — resolves to the newest record. */
const LATEST_CHANGE_ID = 'latest'
/** Route the SPA lands on (see `src/pages/api-changes.vue`). */
const API_CHANGES_PATH = '/api-changes'

/**
 * Bridges the "API Changes" webview to the shared Vue SPA: it injects the built
 * `index.html`, sets `window.__URL__` to `/api-changes` (so the router renders
 * `src/pages/api-changes.vue`), and exposes the change-related RPC handlers via
 * jsonrpc-rx. The page itself fetches data through those handlers.
 */
export class ChangesViewProvider extends AbstractViewProvider {
  constructor(context: ExtensionContext, handlers: HandlerConfig) {
    super(context, handlers, { path: API_CHANGES_PATH })
  }

  /** Expose RPC handlers to the webview. Call once per panel. */
  expose(webview: Webview) {
    this.exposeHandlers(webview)
  }

  /** (Re)inject the built SPA into the webview using the current options. */
  async mount(webview: Webview) {
    webview.html = await this.getWebviewHtml(webview)
  }

  /** Point the SPA at a specific project / record. */
  setQuery(projectPath: string, changeId: string) {
    const options: WebviewOptions = {
      path: API_CHANGES_PATH,
      query: qs.stringify({ projectPath, changeId }),
    }
    this.wiewProviderOptions = options
  }

  /** Full resolve used when the panel is first created (expose + inject). */
  async resolveWebviewView(webviewView: WebviewView | WebviewPanel) {
    const { webview } = webviewView
    this.exposeHandlers(webview)
    webview.html = await this.getWebviewHtml(webview)
  }
}

/**
 * "API Changes" webview — opens a tab that browses the change records written by
 * `worma.generate()` and, after an explicit confirmation, deletes one of them.
 *
 * The page (a Vue SFC) drives all data fetching and rendering; this class only
 * manages the webview panel lifecycle and points the SPA at the right record.
 */
export class ChangesView {
  private static panel: WebviewPanel | undefined
  private static provider: ChangesViewProvider | undefined
  private static context: ExtensionContext | undefined
  private static handlers: HandlerConfig | undefined

  /** Initialise with the extension context and RPC handlers (called at activation). */
  static init(context: ExtensionContext, handlers: HandlerConfig) {
    ChangesView.context = context
    ChangesView.handlers = handlers
  }

  /** The currently open panel (used by tests). */
  static get current() {
    return ChangesView.panel
  }

  static async open(changeId: string = LATEST_CHANGE_ID, projectPath?: string) {
    const target = projectPath ?? getWorkspacePaths()[0]
    if (!ChangesView.panel || !ChangesView.provider) {
      if (!ChangesView.context || !ChangesView.handlers) {
        throw new Error('ChangesView is not initialized; call ChangesView.init() during activation.')
      }
      ChangesView.provider = new ChangesViewProvider(ChangesView.context, ChangesView.handlers)
      ChangesView.panel = window.createWebviewPanel(
        'worma.apiChanges',
        `${displayName}: API Changes`,
        ViewColumn.Active,
        { enableScripts: true, retainContextWhenHidden: true },
      )
      ChangesView.panel.onDidDispose(() => {
        ChangesView.panel = undefined
        ChangesView.provider = undefined
      })
      ChangesView.provider.setQuery(target, changeId)
      await ChangesView.provider.resolveWebviewView(ChangesView.panel)
    }
    else {
      ChangesView.provider.setQuery(target, changeId)
      await ChangesView.provider.mount(ChangesView.panel.webview)
      ChangesView.panel.reveal()
    }
    return ChangesView.panel
  }
}

export default ChangesView
