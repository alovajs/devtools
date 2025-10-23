import type { ApiDescriptor, SchemaObject } from '@/type'
import { payloadModifier } from '@/plugins/presets/payloadModifier'

describe('payloadModifier plugin tests', () => {
  // Helper: get handleApi from plugin without running full generator
  function getHandleApi(configs: Parameters<typeof payloadModifier>[0]) {
    const plugin = payloadModifier(configs)
    const configured = plugin.config?.({} as any) as any
    return configured.handleApi as (api: ApiDescriptor) => ApiDescriptor | null
  }

  it('modifies query/path parameters and removes matched ones', () => {
    const handleApi = getHandleApi([
      { scope: 'params', match: 'age', handler: () => ({ required: true, value: 'string' }) },
      { scope: 'params', match: 'debug', handler: () => null },
      { scope: 'pathParams', match: 'id', handler: () => ({ required: false, value: 'string' }) },
    ])

    const api: ApiDescriptor = {
      url: '/pets/{id}',
      method: 'get',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'age', in: 'query', required: false, schema: { type: 'integer' } },
        { name: 'debug', in: 'query', required: false, schema: { type: 'boolean' } },
        { name: 'q', in: 'query', required: false, schema: { type: 'string' } },
      ],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    // age converted to string and required true
    const ageParam = result.parameters!.find(p => p.in === 'query' && p.name === 'age')!
    expect((ageParam.schema as SchemaObject)?.type).toBe('string')
    expect(ageParam.required).toBe(true)

    // debug removed
    expect(result.parameters!.some(p => p.name === 'debug')).toBe(false)

    // path id string and required false
    const idParam = result.parameters!.find(p => p.in === 'path' && p.name === 'id')!
    expect((idParam.schema as SchemaObject)?.type).toBe('string')
    expect(idParam.required).toBe(false)

    // q unchanged
    const qParam = result.parameters!.find(p => p.in === 'query' && p.name === 'q')!
    expect((qParam.schema as SchemaObject)?.type).toBe('string')
    expect(qParam.required).toBe(false)
  })

  it('modifies request body properties and required', () => {
    const handleApi = getHandleApi([
      { scope: 'data', match: 'name', handler: () => ({ required: true, value: 'number' }) },
      { scope: 'data', match: 'count', handler: () => null },
    ])

    const api: ApiDescriptor = {
      url: '/pets',
      method: 'post',
      parameters: [],
      requestBody: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'integer' },
        },
        required: ['count'],
      },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    const rb = result.requestBody as SchemaObject
    expect((rb.properties?.name as SchemaObject)?.type).toBe('number')
    expect(rb.properties?.count).toBeUndefined()
    // required should only include name now
    expect(rb.required).toEqual(['name'])
  })

  it('recurses into union keywords in responses', () => {
    const handleApi = getHandleApi([
      { scope: 'response', match: 'ok', handler: () => 'number' },
    ])

    const api: ApiDescriptor = {
      url: '/pets',
      method: 'get',
      parameters: [],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: {
        oneOf: [
          { type: 'object', properties: { ok: { type: 'string' } }, required: ['ok'] },
          { type: 'object', properties: { ok: { type: 'string' } }, required: [] },
        ],
      } as any,
    }

    const result = handleApi(api)!
    const res = result.responses!
    expect(Array.isArray(res.oneOf)).toBe(true)
    for (const branch of res.oneOf as SchemaObject[]) {
      expect((branch.properties?.ok as SchemaObject)?.type).toBe('number')
    }
  })

  it('applies multiple configs sequentially', () => {
    const handleApi = getHandleApi([
      { scope: 'params', match: 'age', handler: () => { return 'string' } },
      { scope: 'params', match: 'age', handler: () => { return 'number' } }, // override by second config
      { scope: 'data', match: 'flag', handler: () => { return { required: true, value: 'boolean' } } },
    ])

    const api: ApiDescriptor = {
      url: '/pets',
      method: 'get',
      parameters: [{ name: 'age', in: 'query', schema: { type: 'integer' } }],
      requestBody: { type: 'object', properties: { flag: { type: 'string' } }, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    const ageParam = result.parameters![0]
    expect((ageParam.schema as SchemaObject)?.type).toBe('number') // overridden by second config
    const rb = result.requestBody!
    expect((rb.properties?.flag as SchemaObject)?.type).toBe('boolean')
    expect(rb.required).toEqual(['flag'])
  })

  it('returns null when apiDescriptor is null', () => {
    const handleApi = getHandleApi([{ scope: 'params', match: 'x', handler: () => 'string' }])
    expect(handleApi(null as any)).toBeNull()
  })
})
