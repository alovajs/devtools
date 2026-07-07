import { axiosInstance } from './api/axios/index'
import { fetchClient } from './api/fetch/index'

// --- Shared formatting helpers ---
function formatBody(body: unknown): string {
  if (!body)
    return ''
  if (typeof body === 'string') {
    try {
      return `body: ${JSON.stringify(JSON.parse(body))}`
    }
    catch {
      return `body: ${body}`
    }
  }
  return `body: ${JSON.stringify(body)}`
}

function formatQuery(query: Record<string, any> | undefined, searchParams: URLSearchParams | undefined): string {
  if (query)
    return `query: ${JSON.stringify(query)}`
  if (searchParams && [...searchParams.keys()].length) {
    const obj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      obj[key] = value
    })
    return `query: ${JSON.stringify(obj)}`
  }
  return ''
}

function logParts(tag: string, method: string, url: string, ...parts: (string | undefined)[]) {
  // eslint-disable-next-line no-console
  console.log(`${tag} ${method} ${url}`, parts.filter(Boolean).join(', '))
}

// --- Fetch Client ---
(fetchClient as any).request = async (url: string, init: any = {}) => {
  const method = (init.method || 'GET').toUpperCase()
  logParts('[Fetch Client]', method, url, formatBody(init.body || init.data), formatQuery(init.params, undefined))
  return { mock: true }
};

// --- Axios ---
(axiosInstance.defaults as any).adapter = async (config: any) => {
  const method = (config.method || 'GET').toUpperCase()
  logParts('[Axios]', method, config.url, formatBody(config.data), formatQuery(config.params, undefined))
  return { data: { mock: true }, status: 200, statusText: 'OK', headers: {}, config }
}

// --- Alova & Ky (both use globalThis.fetch; ky passes Request objects) ---
globalThis.fetch = async (url: any, options: any = {}) => {
  const isRequest = url instanceof Request
  const method = isRequest ? url.method : (options.method || 'GET').toUpperCase()
  const urlStr = isRequest ? url.url : (typeof url === 'string' ? url : '')
  const tag = isRequest ? '[Ky]' : '[Alova]'

  // Body: option-based (alova/ky) or, for ky, read from the Request stream.
  let body: unknown = options.json ?? options.data ?? options.body
  if (body === undefined && isRequest) {
    try {
      const text = await url.text()
      if (text)
        body = text
    }
    catch {}
  }

  // Query: only ky forwards `params`/`searchParams`; alova bakes them into the URL.
  const parts: string[] = [formatBody(body)]
  if (isRequest) {
    parts.push(formatQuery(options.params ?? options.searchParams, (url as any).searchParams))
  }

  logParts(tag, method, urlStr, ...parts)
  return new Response(JSON.stringify({ mock: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
