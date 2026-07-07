const { axiosInstance } = require('./api/axios/index.cjs')
const { fetchClient } = require('./api/fetch/index.cjs')

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

// --- Alova (uses globalThis.fetch) ---
globalThis.fetch = async (url, options = {}) => {
  const method = (options.method || 'GET').toUpperCase()
  const urlStr = typeof url === 'string' ? url : ''

  const body = options.json ?? options.data ?? options.body

  logParts('[Alova]', method, urlStr, formatBody(body))
  return new Response(JSON.stringify({ mock: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
