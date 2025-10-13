import type { RequestHandler } from 'msw'
import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { http, HttpResponse } from 'msw'

export default <RequestHandler[]>[
  http.get('https://generator3.swagger.io', async () => HttpResponse.html(`<p class="alova">wormhole</p>`)),
  http.get('https://generator3.swagger.io/openapi.json', async () => {
    const openApiDocs = JSON.parse(await fs.readFile(resolve(__dirname, '../openapis/swagger_2.json'), 'utf-8'))
    return HttpResponse.json(openApiDocs)
  }),
  http.get('https://generator3.swagger.io/v1.0/foo', async () => {
    const openApiDocs = JSON.parse(await fs.readFile(resolve(__dirname, '../openapis/openapi_301.json'), 'utf-8'))
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
    const openApiDocs = JSON.parse(
      await fs.readFile(resolve(__dirname, '../openapis/openapi_301.json'), 'utf-8'),
    )
    return HttpResponse.json(openApiDocs)
  }),
]
