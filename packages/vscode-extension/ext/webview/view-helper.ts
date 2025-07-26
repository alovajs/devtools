import type { ParseOptions } from 'query-string'
import type { ExtensionContext, Webview } from 'vscode'
import qs from 'query-string'

export interface WebviewOptions {
  path?: string
  query?: string
  fragment?: string
  parseOptions?: ParseOptions
}
export class WebviewHelper {
  public static getUrl(options?: WebviewOptions) {
    const defaultParseOptions: ParseOptions = {
      arrayFormat: 'comma',
      parseNumbers: true,
      parseBooleans: true,
    }
    const parseOptions = { ...defaultParseOptions, ...options?.parseOptions }
    const query = qs.parse(options?.query ?? '', parseOptions)
    const fragment = qs.parse(options?.fragment ?? '', parseOptions)
    const path = (options?.path ?? '').replace(/^\//, '')
    const serverUrl = () => {
      let url = (process.env.VITE_DEV_SERVER_URL ?? '').replace(/\/$/, '')
      if (options?.path) {
        url = `${url}/${path}`
      }
      if (options?.query) {
        url = `${url}?${options?.query}`
      }
      if (options?.fragment) {
        url = `${url}#${options?.fragment}`
      }
      return url
    }
    const injectCode = () => {
      const urlObject = {
        path: `/${path}`,
        query,
        fragment,
      }
      return `<script>window.__URL__=${JSON.stringify(urlObject)}</script>`
    }
    return {
      serverUrl: serverUrl(),
      injectCode: injectCode(),
    }
  }

  public static setupHtml(webview: Webview, context: ExtensionContext, options?: WebviewOptions) {
    const { serverUrl, injectCode } = this.getUrl(options)
    return __getWebviewHtml__({
      serverUrl,
      webview,
      context,
      injectCode,
    })
  }
}
