export {}
declare global {
  type ParsedQuery<T = string> = import('query-string').ParsedQuery<T>
  interface WebViewUrl {
    query: ParsedQuery
    fragment: ParsedQuery
    path: string
  }
  namespace globalThis {
    // eslint-disable-next-line vars-on-top, no-var
    var __URL__: WebViewUrl | undefined
  }
}
