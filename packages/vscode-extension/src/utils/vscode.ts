import type { ParseOptions } from 'query-string'
import { WebviewApi } from '@tomjs/vscode-webview'
import qs from 'query-string'
// Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
let webviewApi: WebviewApi | null = null
export function getVscodeApi() {
  if (!import.meta.env.VITE_IS_VSCODE) {
    return null
  }
  if (!webviewApi) {
    webviewApi = new WebviewApi()
  }
  return webviewApi
}
export function getWebViewUrl() {
  if (globalThis.__URL__) {
    return globalThis.__URL__
  }
  const parseOptions: ParseOptions = {
    arrayFormat: 'comma',
    parseNumbers: true,
    parseBooleans: true,
  }
  const path = globalThis.location?.pathname ?? '/'
  const query = qs.parse(globalThis.location?.search, parseOptions)
  const fragment = qs.parse(globalThis.location?.hash, parseOptions)
  return {
    path,
    query,
    fragment,
  }
}
export const isVscode = () => import.meta.env.VITE_IS_VSCODE
