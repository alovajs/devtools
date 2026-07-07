import type { RequestHandler } from 'msw'
import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { http, HttpResponse } from 'msw'

const swagger2Json = () => fs.readFile(resolve(__dirname, '../openapis/swagger_2.json'), 'utf-8').then(JSON.parse)
const openapi301Json = () => fs.readFile(resolve(__dirname, '../openapis/openapi_301.json'), 'utf-8').then(JSON.parse)

export default <RequestHandler[]>[
  http.get('https://generator3.swagger.io', async () => HttpResponse.html(`<p class="alova">worma</p>`)),
  http.get('https://generator3.swagger.io/openapi.json', async () => {
    const openApiDocs = await swagger2Json()
    return HttpResponse.json(openApiDocs)
  }),
  // Handler for platform('swagger') generated URLs — /v2/swagger.json and /api/v3/openapi.json
  http.get('https://generator3.swagger.io/v2/swagger.json', async () => {
    const openApiDocs = await swagger2Json()
    return HttpResponse.json(openApiDocs)
  }),
  http.get('https://generator3.swagger.io/api/v3/openapi.json', async () => {
    const openApiDocs = await swagger2Json()
    return HttpResponse.json(openApiDocs)
  }),
  http.post('https://generator3.swagger.io/v1.0/foo', async () => {
    const openApiDocs = await openapi301Json()
    return HttpResponse.json(openApiDocs)
  }),
  http.post('https://api.apifox.com/v1/projects/:projectId/export-openapi', async ({ request }) => {
    // validate headers
    const ver = request.headers.get('X-Apifox-Api-Version')
    const auth = request.headers.get('Authorization')
    if (!ver || !auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ message: 'invalid headers' }, { status: 400 })
    }

    // validate body
    let body: any = {}
    try {
      body = await request.json()
    }
    catch {
      return HttpResponse.json({ message: 'invalid json' }, { status: 400 })
    }

    const { scope, options, oasVersion, exportFormat } = body || {}
    if (!scope || !options || !oasVersion || exportFormat !== 'JSON') {
      return HttpResponse.json({ message: 'invalid payload' }, { status: 400 })
    }

    // respond with an existing openapi json
    const openApiDocs = await openapi301Json()
    return HttpResponse.json(openApiDocs)
  }),
]
