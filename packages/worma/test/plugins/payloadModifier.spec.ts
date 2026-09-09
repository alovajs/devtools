import type { PayloadModifierConfig } from '@/plugins/presets/payloadModifier'
import type { ApiDescriptor, Parameter, SchemaObject } from '@/type'
import { ParameterIn } from '@/constant'
import { payloadModifier } from '@/plugins/presets/payloadModifier'

describe('payloadModifier plugin', () => {
  // Takes `handleApi` from the plugin without running the whole generator
  function getHandleApi(configs: PayloadModifierConfig[]) {
    const plugin = payloadModifier(configs)
    const configured = plugin.config?.({ config: {} } as any) as any
    return configured.handleApi as (api: ApiDescriptor) => ApiDescriptor | null
  }

  function makeApi(overrides: Partial<ApiDescriptor> = {}): ApiDescriptor {
    return {
      url: '/pets/{id}',
      method: 'get',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'page', in: 'query', required: false, schema: { type: 'integer', description: 'page number' } },
      ],
      requestBody: {
        type: 'object',
        description: 'the body',
        properties: {
          id: { type: 'integer', description: 'pet id' },
          name: { type: 'string', description: 'pet name' },
          legacyFlag: { type: 'boolean' },
        },
        required: ['id'],
      },
      responses: {
        type: 'object',
        properties: {
          code: { type: 'integer', description: 'status code' },
          data: {
            type: 'object',
            description: 'the payload',
            properties: {
              id: { type: 'integer', description: 'pet id' },
              name: { type: 'string', description: 'pet name' },
              debugInfo: { type: 'string', description: 'debug' },
            },
            required: ['id'],
          },
        },
        required: ['data'],
      },
      ...overrides,
    }
  }

  function warnSpy() {
    return vi.spyOn(console, 'warn').mockImplementation(() => {})
  }

  it('returns null when the descriptor is null', () => {
    const handleApi = getHandleApi([{ scope: 'response', patch: 'string' }])
    expect(handleApi(null as any)).toBeNull()
  })

  describe('interface filter', () => {
    it('applies only when the url matches (string / RegExp / function / array)', () => {
      const patch: PayloadModifierConfig = { scope: 'response', patch: { debugInfo: null } }
      const makeTarget = () => makeApi({
        url: '/pets/{id}',
        responses: {
          type: 'object',
          properties: { debugInfo: { type: 'string' } },
          required: [],
        },
      })

      expect(getHandleApi([{ ...patch, path: '/pets' }])(makeTarget())).toBeTruthy()
      expect((getHandleApi([{ ...patch, path: '/pets' }])(makeTarget())!.responses as SchemaObject).properties?.debugInfo).toBeUndefined()
      // unmatched -> returned untouched
      const untouched = makeTarget()
      expect(getHandleApi([{ ...patch, path: '/orders' }])(untouched)).toBe(untouched)
      // array of rules is ORed
      expect((getHandleApi([{ ...patch, path: ['/orders', '/pets'] }])(makeTarget())!.responses as SchemaObject).properties?.debugInfo).toBeUndefined()
      // RegExp and function
      expect((getHandleApi([{ ...patch, path: /^\/pe/ }])(makeTarget())!.responses as SchemaObject).properties?.debugInfo).toBeUndefined()
      expect((getHandleApi([{ ...patch, path: url => url.endsWith('{id}') }])(makeTarget())!.responses as SchemaObject).properties?.debugInfo).toBeUndefined()
    })

    it('filters by tag and ANDs it with path', () => {
      const targetId = { id: null } as never
      const makeTarget = () => makeApi({
        url: '/pets',
        tags: ['Coverage', 'Pets'],
        responses: { type: 'object', properties: { id: { type: 'integer' } }, required: [] },
      })
      const hasId = (api: ApiDescriptor | null) => !!(api!.responses as SchemaObject).properties?.id

      expect(hasId(getHandleApi([{ scope: 'response', tag: 'Coverage', patch: targetId }])(makeTarget()))).toBe(false)
      expect(hasId(getHandleApi([{ scope: 'response', tag: ['MissingTag', 'Pets'], patch: targetId }])(makeTarget()))).toBe(false)
      // an api without tags never matches a tag filter
      const noTags = makeApi({ url: '/pets', tags: undefined })
      expect(getHandleApi([{ scope: 'response', tag: 'Coverage', patch: targetId }])(noTags)).toBe(noTags)
      // path and tag are ANDed
      const otherPath = makeApi({ url: '/orders', tags: ['Coverage'] })
      expect(getHandleApi([{ scope: 'response', path: '/pets', tag: 'Coverage', patch: targetId }])(otherPath)).toBe(otherPath)
    })
  })

  describe('unwrap', () => {
    it('replaces the scope root, keeping every comment', () => {
      const result = getHandleApi([{ scope: 'response', unwrap: 'data' }])(makeApi())!
      expect(result.responses).toEqual({
        type: 'object',
        description: 'the payload',
        properties: {
          id: { type: 'integer', description: 'pet id' },
          name: { type: 'string', description: 'pet name' },
          debugInfo: { type: 'string', description: 'debug' },
        },
        required: ['id'],
      })
    })

    it('supports nested paths', () => {
      const api = makeApi({
        responses: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              description: 'wrapper',
              properties: { list: { type: 'object', description: 'inner', properties: { id: { type: 'integer' } } } },
            },
          },
        },
      })
      const result = getHandleApi([{ scope: 'response', unwrap: 'data.list' }])(api)!
      expect(result.responses).toEqual({ type: 'object', description: 'inner', properties: { id: { type: 'integer' } } })
    })

    it('warns and skips when the path does not exist', () => {
      const spy = warnSpy()
      const api = makeApi()
      const result = getHandleApi([{ scope: 'response', unwrap: 'missing.child', patch: 'string' }])(api)
      expect(spy).toHaveBeenCalled()
      expect(result).toBe(api)
      spy.mockRestore()
    })

    it('applies to parameter scopes through the object view', () => {
      const api = makeApi({
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'filter', in: 'query', required: false, schema: { type: 'object', description: 'the filter', properties: { kind: { type: 'string', description: 'the kind' } } } },
        ],
      })
      const result = getHandleApi([{ scope: 'params', unwrap: 'filter' }])(api)!
      const params = result.parameters!.filter(p => p.in === ParameterIn.QUERY)
      expect(params).toEqual([{ name: 'kind', in: 'query', required: false, schema: { type: 'string', description: 'the kind' } }])
    })
  })

  describe('match', () => {
    it('locates every matching top-level field', () => {
      const result = getHandleApi([{ scope: 'response', match: /(code|data)/, patch: 'string' }])(makeApi())!
      const res = result.responses as SchemaObject
      expect(res.properties?.code).toEqual({ type: 'string', description: 'status code' })
      expect(res.properties?.data).toEqual({ type: 'string', description: 'the payload' })
    })

    it('supports string, RegExp and function rules', () => {
      const keys: Array<string | undefined> = []
      const remember = (schema: SchemaObject, key?: string) => {
        keys.push(key)
        return schema
      }
      const handleApi = getHandleApi([
        { scope: 'data', match: 'name', handler: remember },
        { scope: 'data', match: /Flag$/, handler: remember },
        { scope: 'data', match: k => k === 'id', handler: remember },
      ])
      handleApi(makeApi())
      expect(keys).toEqual(['name', 'legacyFlag', 'id'])
    })

    it('is a silent no-op when nothing matches', () => {
      const api = makeApi()
      expect(getHandleApi([{ scope: 'response', match: 'nothing', patch: null }])(api)).toBe(api)
    })

    it('patches the root itself when match is omitted', () => {
      const result = getHandleApi([{ scope: 'data', patch: { description: 'new doc' } }])(makeApi())!
      expect(result.requestBody).toEqual(expect.objectContaining({ description: 'new doc', type: 'object' }))
    })
  })

  describe('patch', () => {
    it('deletes matched fields with null', () => {
      const result = getHandleApi([{ scope: 'response', unwrap: 'data', patch: { debugInfo: null, name: null } }])(makeApi())!
      const res = result.responses as SchemaObject
      expect(Object.keys(res.properties!)).toEqual(['id'])
      expect(res.required).toEqual(['id'])
    })

    it('empties the scope when the root itself is deleted', () => {
      const result = getHandleApi([{ scope: 'data', patch: null }])(makeApi())!
      expect(result.requestBody).toBeUndefined()
    })

    it('only empties its own parameter location', () => {
      const result = getHandleApi([{ scope: 'params', patch: null }])(makeApi())!
      expect(result.parameters!.filter(p => p.in === ParameterIn.QUERY)).toEqual([])
      expect(result.parameters!.filter(p => p.in === ParameterIn.PATH)).toHaveLength(1)
    })

    it('treats a string or array as a type shorthand and keeps documentation', () => {
      const api = makeApi({
        requestBody: {
          type: 'object',
          properties: {
            count: { type: 'integer', format: 'int64', description: 'a count' },
            tags: { type: 'array', items: { type: 'number' }, description: 'the tags' },
          },
          required: [],
        },
      })
      const result = getHandleApi([
        { scope: 'data', match: 'count', patch: 'string' },
        { scope: 'data', match: 'tags', patch: ['string'] },
      ])(api)!
      const rb = result.requestBody as SchemaObject
      expect(rb.properties?.count).toEqual({ type: 'string', description: 'a count' })
      expect(rb.properties?.tags).toEqual({ type: 'array', items: { type: 'string' }, description: 'the tags' })
    })

    it('merges a plain object into properties but rebuilds with an explicit type', () => {
      const makeNested = () => makeApi({
        requestBody: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              description: 'the user',
              properties: { age: { type: 'integer' }, keep: { type: 'string' } },
              required: ['age'],
            },
          },
          required: ['user'],
        },
      })

      const merged = getHandleApi([{ scope: 'data', match: 'user', patch: { name: 'string' } }])(makeNested())!
      expect((merged.requestBody as SchemaObject).properties?.user).toEqual({
        type: 'object',
        description: 'the user',
        properties: {
          age: { type: 'integer' },
          keep: { type: 'string' },
          name: { type: 'string' },
        },
        required: ['age', 'name'],
      })

      const replaced = getHandleApi([{ scope: 'data', match: 'user', patch: { type: { name: 'string' } } }])(makeNested())!
      expect((replaced.requestBody as SchemaObject).properties?.user).toEqual({
        type: 'object',
        description: 'the user',
        properties: { name: { type: 'string' } },
        required: ['name'],
      })
    })

    it('keeps siblings untouched when merging into properties', () => {
      const api = makeApi({
        requestBody: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              description: 'the user',
              properties: { id: { type: 'integer', description: 'user id' }, name: { type: 'string', description: 'user name' } },
              required: ['id'],
            },
          },
          required: ['user'],
        },
      })
      const result = getHandleApi([{ scope: 'data', match: 'user', patch: { name: 'string' } }])(api)!
      // `name` existed and was optional, so omitting `required` keeps it optional
      expect((result.requestBody as SchemaObject).properties?.user).toEqual({
        type: 'object',
        description: 'the user',
        properties: { id: { type: 'integer', description: 'user id' }, name: { type: 'string', description: 'user name' } },
        required: ['id'],
      })
    })

    it('warns and skips when a field table targets a non-object', () => {
      const spy = warnSpy()
      const api = makeApi()
      const result = getHandleApi([{ scope: 'data', match: 'name', patch: { inner: 'string' } }])(api)!
      expect(spy).toHaveBeenCalled()
      expect((result.requestBody as SchemaObject).properties?.name).toEqual({ type: 'string', description: 'pet name' })
      spy.mockRestore()
    })

    it('writes partial patches without touching the other keys', () => {
      const api = makeApi({
        requestBody: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email', description: 'mail' },
            status: { type: 'string', description: 'status' },
          },
          required: [],
        },
      })
      const result = getHandleApi([
        { scope: 'data', match: 'email', patch: { description: 'contact mail', deprecated: true } },
        { scope: 'data', match: 'status', patch: { enum: ['on', 'off'] } },
      ])(api)!
      const rb = result.requestBody as SchemaObject
      expect(rb.properties?.email).toEqual({ type: 'string', format: 'email', description: 'contact mail', deprecated: true })
      expect(rb.properties?.status).toEqual({ type: 'string', description: 'status', enum: ['on', 'off'] })
    })

    it('uses properties as the escape hatch for reserved key names', () => {
      const api = makeApi({
        requestBody: { type: 'object', properties: { description: { type: 'number' } }, required: [] },
      })
      const result = getHandleApi([{ scope: 'data', patch: { properties: { description: { type: 'string' } } } }])(api)!
      expect((result.requestBody as SchemaObject).properties?.description).toEqual({ type: 'string' })
    })

    it('supports tuples, unions and TS-only primitive types', () => {
      const api = makeApi({
        requestBody: {
          type: 'object',
          properties: {
            pair: { type: 'array', items: { type: 'string' } },
            value: { type: 'string' },
            any: { type: 'string' },
            never: { type: 'string' },
          },
          required: [],
        },
      })
      const result = getHandleApi([
        { scope: 'data', match: 'pair', patch: ['string', 'number'] },
        { scope: 'data', match: 'value', patch: { oneOf: ['string', 'number'] } },
        { scope: 'data', match: 'any', patch: 'unknown' },
        { scope: 'data', match: 'never', patch: 'never' },
      ])(api)!
      const rb = result.requestBody as SchemaObject
      expect(rb.properties?.pair).toEqual({ type: 'array', items: [{ type: 'string' }, { type: 'number' }] })
      expect(rb.properties?.value).toEqual({ oneOf: [{ type: 'string' }, { type: 'number' }] })
      expect((rb.properties?.any as SchemaObject).type).toBe('unknown')
      expect((rb.properties?.never as SchemaObject).type).toBe('never')
    })

    it('infers the type of a new enum field', () => {
      const result = getHandleApi([
        { scope: 'data', patch: { size: { enum: [1, 2] }, rate: { enum: [1.5, 2.5] } } },
      ])(makeApi())!
      const rb = result.requestBody as SchemaObject
      expect(rb.properties?.size).toEqual({ enum: [1, 2], type: 'integer' })
      expect(rb.properties?.rate).toEqual({ enum: [1.5, 2.5], type: 'number' })
    })

    it('adds array items and forces the array type', () => {
      const api = makeApi({ requestBody: { type: 'object', properties: { list: {} }, required: [] } })
      const result = getHandleApi([{ scope: 'data', match: 'list', patch: { items: 'string' } }])(api)!
      expect((result.requestBody as SchemaObject).properties?.list).toEqual({ items: { type: 'string' }, type: 'array' })
    })

    it('throws on an unknown primitive type', () => {
      const handleApi = getHandleApi([{ scope: 'data', match: 'name', patch: 'int64' as any }])
      expect(() => handleApi(makeApi())).toThrow(/Invalid schema type "int64"/)
    })
  })

  describe('required', () => {
    it('makes added fields required by default and honours required: false', () => {
      const result = getHandleApi([
        {
          scope: 'data',
          patch: {
            operatorId: { type: 'string', description: 'operator code' },
            optionalNote: { type: 'string', required: false },
          },
        },
      ])(makeApi())!
      const rb = result.requestBody as SchemaObject
      expect(rb.properties?.operatorId).toEqual({ type: 'string', description: 'operator code' })
      expect(rb.required).toEqual(expect.arrayContaining(['id', 'operatorId']))
      expect(rb.required).not.toContain('optionalNote')
    })

    it('translates field requiredness to ParameterObject.required', () => {
      const result = getHandleApi([{ scope: 'params', match: 'page', patch: { required: true } }])(makeApi())!
      const page = result.parameters!.find(p => p.name === 'page') as Parameter
      expect(page.required).toBe(true)
      expect(page.schema).toEqual({ type: 'integer', description: 'page number' })
    })

    it('keeps the current requiredness when required is omitted', () => {
      const result = getHandleApi([{ scope: 'data', match: 'name', patch: 'string' }])(makeApi())!
      expect((result.requestBody as SchemaObject).required).toEqual(['id'])
    })

    it('makes an existing field optional', () => {
      const result = getHandleApi([{ scope: 'data', match: 'id', patch: { required: false } }])(makeApi())!
      expect((result.requestBody as SchemaObject).required).toEqual([])
    })
  })

  describe('handler', () => {
    it('receives and returns raw OpenAPI schemas', () => {
      let received: unknown
      let key: string | undefined
      const handleApi = getHandleApi([
        {
          scope: 'response',
          match: 'data',
          handler: (schema, fieldKey) => {
            received = schema
            key = fieldKey
            return { ...schema, description: 'handled' }
          },
        },
      ])
      const result = handleApi(makeApi())!
      expect(received).toEqual(makeApi().responses!.properties!.data)
      expect(key).toBe('data')
      expect((result.responses as SchemaObject).properties?.data).toEqual(expect.objectContaining({ description: 'handled' }))
    })

    it('deletes the target when it returns null or undefined', () => {
      const removed = getHandleApi([{ scope: 'response', match: 'code', handler: () => null }])(makeApi())!
      expect((removed.responses as SchemaObject).properties?.code).toBeUndefined()

      const api = makeApi({ responses: { type: 'object', properties: { code: { type: 'integer' } }, required: [] } })
      const cleared = getHandleApi([{ scope: 'response', handler: () => undefined }])(api)!
      expect(cleared.responses).toBeUndefined()
    })

    it('runs after patch', () => {
      let seen: SchemaObject | undefined
      const result = getHandleApi([
        {
          scope: 'data',
          match: 'id',
          patch: 'string',
          handler: (schema) => {
            seen = schema
            return schema
          },
        },
      ])(makeApi())!
      expect(seen).toEqual({ type: 'string', description: 'pet id' })
      expect((result.requestBody as SchemaObject).properties?.id).toEqual({ type: 'string', description: 'pet id' })
    })
  })

  describe('pipeline', () => {
    it('applies configs in order, each seeing the previous result', () => {
      const result = getHandleApi([
        { scope: 'response', unwrap: 'data' },
        { scope: 'response', match: /[Ii]d$/, patch: 'string' },
        { scope: 'response', patch: { debugInfo: null } },
      ])(makeApi())!
      expect(result.responses).toEqual({
        type: 'object',
        description: 'the payload',
        properties: {
          id: { type: 'string', description: 'pet id' },
          name: { type: 'string', description: 'pet name' },
        },
        required: ['id'],
      })
    })

    it('combines several scopes', () => {
      const result = getHandleApi([
        { scope: 'params', match: 'page', patch: 'string' },
        { scope: 'pathParams', match: 'id', patch: 'string' },
        { scope: 'data', match: 'id', patch: 'string' },
      ])(makeApi())!
      expect(result.parameters!.find(p => p.name === 'page')!.schema).toEqual({ type: 'string', description: 'page number' })
      expect(result.parameters!.find(p => p.name === 'id')!.schema).toEqual({ type: 'string' })
      expect((result.requestBody as SchemaObject).properties?.id).toEqual({ type: 'string', description: 'pet id' })
    })

    it('appends brand new parameters to the parameter list', () => {
      const result = getHandleApi([{ scope: 'params', patch: { token: { type: 'string', required: false } } }])(makeApi())!
      const query = result.parameters!.filter(p => p.in === ParameterIn.QUERY)
      expect(query[0].name).toBe('page')
      expect(query[1]).toEqual({ name: 'token', in: 'query', required: false, schema: { type: 'string' } })
    })

    it('is idempotent for the same plugin instance', () => {
      const handleApi = getHandleApi([{ scope: 'response', unwrap: 'data' }])
      const first = handleApi(makeApi())!
      const second = handleApi(first)!
      expect(second).toBe(first)
    })

    it('drops the internal $ref marker when a node is replaced', () => {
      const api = makeApi({
        responses: {
          type: 'object',
          properties: {
            data: { _$ref: '#/components/schemas/Pet', type: 'object', description: 'pet' } as SchemaObject,
          },
        },
      })
      const result = getHandleApi([{ scope: 'response', unwrap: 'data' }])(api)!
      const responses = result.responses as Record<string, any>
      expect(responses._$ref).toBeUndefined()
      expect(responses.description).toBe('pet')
    })
  })
})
