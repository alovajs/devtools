import { join } from 'path-browserify'

const theWindow = globalThis as any
const webviewPublicPath = (theWindow?.__webview_uri__ as string) ?? ''
const webViewInitialPath = (theWindow?.__webview_path__ as string) ?? '/'
// 将 WebviewUri 拼接与当前路径进行拼接
export function joinWebviewUri(relativePath: string) {
  return join(webviewPublicPath, relativePath)
}

export function getWebViewRootRoutePath() {
  return webViewInitialPath
}
