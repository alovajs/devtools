/* eslint-disable no-var */
/* eslint-disable vars-on-top */
export {}
declare global {
  type ParsedQuery<T = string> = import('query-string').ParsedQuery<T>
  interface WebViewUrl {
    query: ParsedQuery
    fragment: ParsedQuery
    path: string
  }
  namespace globalThis {
    var __URL__: WebViewUrl | undefined
    var $message: import('naive-ui').MessageApi
    var $notify: import('naive-ui').NotificationApi
    var $modal: import('naive-ui').ModalApi
    var $loadingBar: import('naive-ui').LoadingBarApi
    var $dalog: import('naive-ui').DialogApi
  }
}
