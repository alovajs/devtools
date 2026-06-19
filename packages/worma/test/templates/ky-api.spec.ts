import type { GeneratedModule } from './runGenerated'
import { http, HttpResponse } from 'msw'
import { getServer } from '../mswServer'
import { buildGeneratedModule } from './runGenerated'

const BASE = 'http://petstore.swagger.io/v2'

describe('ky template — API call execution', () => {
  let mod: GeneratedModule
  afterEach(async () => { await mod?.cleanup() })

  describe('typescript', () => {
    it('gET with searchParams: params forwarded, returns data', async () => {
      let receivedParams: Record<string, string> = {}
      getServer().use(
        http.get(`${BASE}/pet/findByStatus`, ({ request }) => {
          receivedParams = Object.fromEntries(new URL(request.url).searchParams)
          return HttpResponse.json([{ id: 1, name: 'dog', status: 'available' }])
        }),
      )
      mod = await buildGeneratedModule({ template: 'ky', type: 'ts', serviceTag: 'pet' })
      const result = await mod.call('findPetsByStatus', { searchParams: { status: 'available' } })
      expect(receivedParams.status).toBe('available')
      expect(result).toEqual([{ id: 1, name: 'dog', status: 'available' }])
    })

    it('gET with path params: substitutes {petId}', async () => {
      let receivedId = ''
      getServer().use(
        http.get(`${BASE}/pet/:petId`, ({ params }) => {
          receivedId = params.petId as string
          return HttpResponse.json({ id: 5, name: 'cat' })
        }),
      )
      mod = await buildGeneratedModule({ template: 'ky', type: 'ts', serviceTag: 'pet' })
      const result = await mod.call('getPetById', { pathParams: { petId: 5 } })
      expect(receivedId).toBe('5')
      expect(result).toEqual({ id: 5, name: 'cat' })
    })

    it('pUT with json body: sends and returns response', async () => {
      let receivedBody: any = null
      getServer().use(
        http.put(`${BASE}/pet`, async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({ id: 88, name: receivedBody.name })
        }),
      )
      mod = await buildGeneratedModule({ template: 'ky', type: 'ts', serviceTag: 'pet' })
      const result = await mod.call('updatePet', { json: { id: 0, name: 'kypet', photoUrls: [] } })
      expect(receivedBody.name).toBe('kypet')
      expect(result).toEqual({ id: 88, name: 'kypet' })
    })

    it('blob response: returns Blob', async () => {
      getServer().use(
        http.get(`${BASE}/generate`, () =>
          new HttpResponse(new Uint8Array([3, 4]).buffer, {
            headers: { 'Content-Type': 'application/octet-stream' },
          })),
      )
      mod = await buildGeneratedModule({
        template: 'ky',
        type: 'ts',
        openApiFile: 'openapi_success_key.json',
        serviceTag: 'clients',
        baseURLOverride: `${BASE}/`,
      })
      const result = await mod.call('generateCase1', { searchParams: { codegenOptionsURL: 'http://x' } })
      expect(result).toBeInstanceOf(Blob)
    })
  })

  describe('module', () => {
    it('gET with searchParams: returns data', async () => {
      let receivedParams: Record<string, string> = {}
      getServer().use(
        http.get(`${BASE}/pet/findByStatus`, ({ request }) => {
          receivedParams = Object.fromEntries(new URL(request.url).searchParams)
          return HttpResponse.json([{ id: 2, name: 'bird', status: 'sold' }])
        }),
      )
      mod = await buildGeneratedModule({ template: 'ky', type: 'module', serviceTag: 'pet' })
      const result = await mod.call('findPetsByStatus', { searchParams: { status: 'sold' } })
      expect(receivedParams.status).toBe('sold')
      expect(result).toEqual([{ id: 2, name: 'bird', status: 'sold' }])
    })

    it('pUT with json body: returns response', async () => {
      let receivedBody: any = null
      getServer().use(
        http.put(`${BASE}/pet`, async ({ request }) => {
          receivedBody = await request.json()
          return HttpResponse.json({ id: 44, name: receivedBody.name })
        }),
      )
      mod = await buildGeneratedModule({ template: 'ky', type: 'module', serviceTag: 'pet' })
      const result = await mod.call('updatePet', { json: { id: 0, name: 'ky-mod', photoUrls: [] } })
      expect(receivedBody.name).toBe('ky-mod')
      expect(result.id).toBe(44)
    })

    it('blob response: returns Blob', async () => {
      getServer().use(
        http.get(`${BASE}/generate`, () =>
          new HttpResponse(new Uint8Array([7]).buffer, {
            headers: { 'Content-Type': 'application/octet-stream' },
          })),
      )
      mod = await buildGeneratedModule({
        template: 'ky',
        type: 'module',
        openApiFile: 'openapi_success_key.json',
        serviceTag: 'clients',
        baseURLOverride: `${BASE}/`,
      })
      const result = await mod.call('generateCase1', { searchParams: { codegenOptionsURL: 'http://x' } })
      expect(result).toBeInstanceOf(Blob)
    })
  })
})
