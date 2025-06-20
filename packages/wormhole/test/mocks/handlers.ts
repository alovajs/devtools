import { http, HttpResponse, RequestHandler } from 'msw';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';

export default <RequestHandler[]>[
  http.get('https://generator3.swagger.io', async () => HttpResponse.html(`<p class="alova">wormhole</p>`)),
  http.get('https://generator3.swagger.io/openapi.json', async () => {
    const openApiDocs = JSON.parse(await fs.readFile(resolve(__dirname, '../openapis/swagger_2.json'), 'utf-8'));
    return HttpResponse.json(openApiDocs);
  })
];
