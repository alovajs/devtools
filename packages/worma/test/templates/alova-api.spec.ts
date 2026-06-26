import type { GeneratedModule } from './runGenerated'
import { http, HttpResponse } from 'msw'
import { getServer } from '../mswServer'
import { buildGeneratedModule } from './runGenerated'

const BASE = 'http://petstore.swagger.io/v2'

// Alova returns a Method object — call .send() to trigger the request
async function send(mod: GeneratedModule, fnName: string, config: Record<string, any> = {}) {
  const method = await mod.call(fnName, config)
  return method.send ? method.send() : method
}

describe('alova template — API call execution', () => {
  let mod: GeneratedModule
  afterEach(async () => {
    await mod?.cleanup()
  })

  describe('typescript', () => {
    it('gET with query params: passes params and returns response', async () => {
      let receivedParams: Record<string, string> = {}
      getServer().use(
        http.get(`${BASE}/pet/findByStatus`, ({ request }) => {
          receivedParams = Object.fromEntries(new URL(request.url).searchParams)
          return HttpResponse.json([{ id: 1, name: 'dog', status: 'available' }])
        }),
      )
      mod = await buildGeneratedModule({ template: 'alova', type: 'ts', serviceTag: 'pet' })
      const result = await send(mod, 'findPetsByStatus', { params: { status: 'available' } })
      expect(receivedParams.status).toBe('available')
      expect(Array.isArray(result)).toBe(true)
      expect(result[0].name).toBe('dog')
    })

    it('gET with path params: substitutes {petId}', async () => {
      let receivedId = ''
      getServer().use(
        http.get(`${BASE}/pet/:petId`, ({ params }) => {
          receivedId = params.petId as string
          return HttpResponse.json({ id: 3, name: 'bird' })
        }),
      )
      mod = await buildGeneratedModule({ template: 'alova', type: 'ts', serviceTag: 'pet' })
      const result = await send(mod, 'getPetById', { pathParams: { petId: 3 } })
      expect(receivedId).toBe('3')
      expect(result.name).toBe('bird')
    })

    it('pUT with data body: sends and returns response', async () => {
      let receivedBody: any = null
      getServer().use(
        http.put(`${BASE}/pet`, async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({ id: 77, name: receivedBody.name })
        }),
      )
      mod = await buildGeneratedModule({ template: 'alova', type: 'ts', serviceTag: 'pet' })
      const result = await send(mod, 'updatePet', { data: { id: 0, name: 'alovapet', photoUrls: [] } })
      expect(receivedBody.name).toBe('alovapet')
      expect(result.id).toBe(77)
    })

    it('blob response: returns Blob', async () => {
      getServer().use(
        http.get(`${BASE}/generate`, () =>
          new HttpResponse(new Uint8Array([1, 2]).buffer, {
            headers: { 'Content-Type': 'application/octet-stream' },
          })),
      )
      mod = await buildGeneratedModule({
        template: 'alova',
        type: 'ts',
        openApiFile: 'openapi_success_key.json',
        serviceTag: 'clients',
        baseURLOverride: BASE,
      })
      const result = await send(mod, 'generateCase1', { params: { codegenOptionsURL: 'http://x' } })
      expect(result).toBeInstanceOf(Blob)
    })
  })

  describe('module', () => {
    it('gET with query params: returns response', async () => {
      let receivedParams: Record<string, string> = {}
      getServer().use(
        http.get(`${BASE}/pet/findByStatus`, ({ request }) => {
          receivedParams = Object.fromEntries(new URL(request.url).searchParams)
          return HttpResponse.json([{ id: 2, name: 'cat', status: 'sold' }])
        }),
      )
      mod = await buildGeneratedModule({ template: 'alova', type: 'module', serviceTag: 'pet' })
      const result = await send(mod, 'findPetsByStatus', { params: { status: 'sold' } })
      expect(receivedParams.status).toBe('sold')
      expect(result[0].name).toBe('cat')
    })

    it('pUT with data: returns response', async () => {
      let receivedBody: any = null
      getServer().use(
        http.put(`${BASE}/pet`, async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({ id: 55, name: receivedBody.name })
        }),
      )
      mod = await buildGeneratedModule({ template: 'alova', type: 'module', serviceTag: 'pet' })
      const result = await send(mod, 'updatePet', { data: { id: 0, name: 'alova-mod', photoUrls: [] } })
      expect(receivedBody.name).toBe('alova-mod')
      expect(result.id).toBe(55)
    })

    it('blob response: returns Blob', async () => {
      getServer().use(
        http.get(`${BASE}/generate`, () =>
          new HttpResponse(new Uint8Array([8]).buffer, {
            headers: { 'Content-Type': 'application/octet-stream' },
          })),
      )
      mod = await buildGeneratedModule({
        template: 'alova',
        type: 'module',
        openApiFile: 'openapi_success_key.json',
        serviceTag: 'clients',
        baseURLOverride: BASE,
      })
      const result = await send(mod, 'generateCase1', { params: { codegenOptionsURL: 'http://x' } })
      expect(result).toBeInstanceOf(Blob)
    })
  })

  describe('commonjs', () => {
    it('gET with query params: returns response', async () => {
      let receivedParams: Record<string, string> = {}
      getServer().use(
        http.get(`${BASE}/pet/findByStatus`, ({ request }) => {
          receivedParams = Object.fromEntries(new URL(request.url).searchParams)
          return HttpResponse.json([{ id: 9, name: 'fish', status: 'pending' }])
        }),
      )
      mod = await buildGeneratedModule({ template: 'alova', type: 'commonjs', serviceTag: 'pet' })
      const result = await send(mod, 'findPetsByStatus', { params: { status: 'pending' } })
      expect(receivedParams.status).toBe('pending')
      expect(result[0].name).toBe('fish')
    })

    it('pUT with data: returns response', async () => {
      let receivedBody: any = null
      getServer().use(
        http.put(`${BASE}/pet`, async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({ id: 66, name: receivedBody.name })
        }),
      )
      mod = await buildGeneratedModule({ template: 'alova', type: 'commonjs', serviceTag: 'pet' })
      const result = await send(mod, 'updatePet', { data: { id: 0, name: 'alova-cjs', photoUrls: [] } })
      expect(receivedBody.name).toBe('alova-cjs')
      expect(result.id).toBe(66)
    })

    it('blob response: returns Blob', async () => {
      getServer().use(
        http.get(`${BASE}/generate`, () =>
          new HttpResponse(new Uint8Array([4]).buffer, {
            headers: { 'Content-Type': 'application/octet-stream' },
          })),
      )
      mod = await buildGeneratedModule({
        template: 'alova',
        type: 'commonjs',
        openApiFile: 'openapi_success_key.json',
        serviceTag: 'clients',
        baseURLOverride: BASE,
      })
      const result = await send(mod, 'generateCase1', { params: { codegenOptionsURL: 'http://x' } })
      expect(result).toBeInstanceOf(Blob)
    })
  })
})
