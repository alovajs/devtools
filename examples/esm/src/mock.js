import { axiosInstance } from './api/axios/index.js'
import { fetchClient } from './api/fetch/index.js'

// --- Shared formatting helpers ---
function formatBody(body) {
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

function formatQuery(query, searchParams) {
  if (query)
    return `query: ${JSON.stringify(query)}`
  if (searchParams && [...searchParams.keys()].length) {
    const obj = {}
    searchParams.forEach((value, key) => {
      obj[key] = value
    })
    return `query: ${JSON.stringify(obj)}`
  }
  return ''
}

function logParts(tag, method, url, ...parts) {
  // eslint-disable-next-line no-console
  console.log(`${tag} ${method} ${url}`, parts.filter(Boolean).join(', '))
}

// --- Fetch Client ---
fetchClient.request = async (url, init = {}) => {
  const method = (init.method || 'GET').toUpperCase()
  logParts(
    '[Fetch Client]',
    method,
    url,
    formatBody(init.body || init.data),
    formatQuery(init.params),
  )
  return { mock: true }
}

// --- Axios ---
axiosInstance.defaults.adapter = async (config) => {
  const method = (config.method || 'GET').toUpperCase()
  logParts(
    '[Axios]',
    method,
    config.url,
    formatBody(config.data),
    formatQuery(config.params),
  )
  return {
    data: { mock: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  }
}

// --- Alova & Ky (both use globalThis.fetch; ky passes Request objects) ---
globalThis.fetch = async (url, options = {}) => {
  const isKy = url instanceof Request
  const method = isKy ? url.method : (options.method || 'GET').toUpperCase()
  const urlStr = isKy ? url.url : typeof url === 'string' ? url : ''
  const tag = isKy ? '[Ky]' : '[Alova]'

  // Body: option-based (alova/ky) or, for ky, read from the Request stream.
  let body = options.json ?? options.data ?? options.body
  if (body === undefined && isKy) {
    try {
      const text = await url.text()
      if (text)
        body = text
    }
    catch {}
  }

  // Query: only ky forwards `params`/`searchParams`; alova bakes them into the URL.
  const parts = [formatBody(body)]
  if (isKy) {
    parts.push(
      formatQuery(options.params ?? options.searchParams, url.searchParams),
    )
  }

  logParts(tag, method, urlStr, ...parts)
  return new Response(JSON.stringify({ mock: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
