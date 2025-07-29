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
]
