// Unified mock for all monorepo example apps.
// Each app imports the setup function it needs and calls it before importing API services.

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
  console.log(`[${tag}] ${method} ${url}`, parts.filter(Boolean).join(', '))
}

export function setupAlovaMock() {
  globalThis.fetch = async (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase()
    const urlStr = typeof url === 'string' ? url : url.url
    const body = options.json ?? options.data ?? options.body
    logParts(
      'Alova',
      method,
      urlStr,
      formatBody(body),
      formatQuery(options.params),
    )
    return new Response(JSON.stringify({ mock: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export function setupAxiosMock(axiosInstance) {
  axiosInstance.defaults.adapter = async (config) => {
    const method = (config.method || 'GET').toUpperCase()
    logParts(
      'Axios',
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
}

export function setupFetchMock(fetchClient) {
  fetchClient.request = async (url, init = {}) => {
    const method = (init.method || 'GET').toUpperCase()
    logParts(
      'Fetch Client',
      method,
      url,
      formatBody(init.body || init.data),
      formatQuery(init.params),
    )
    return { mock: true }
  }
}

export function setupKyMock() {
  globalThis.fetch = async (url, options = {}) => {
    const isKy = url instanceof Request
    const method = isKy ? url.method : (options.method || 'GET').toUpperCase()
    const urlStr = isKy ? url.url : typeof url === 'string' ? url : ''

    let body = options.json ?? options.data ?? options.body
    if (body === undefined && isKy) {
      try {
        const text = await url.text()
        if (text)
          body = text
      }
      catch {}
    }

    const parts = [formatBody(body)]
    if (isKy) {
      parts.push(
        formatQuery(options.params ?? options.searchParams, url.searchParams),
      )
    }

    logParts('Ky', method, urlStr, ...parts)
    return new Response(JSON.stringify({ mock: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
