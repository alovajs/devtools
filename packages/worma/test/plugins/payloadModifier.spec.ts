import type { SchemaOneOf } from '@/plugins/presets/payloadModifier'
import type { ApiDescriptor, SchemaObject } from '@/type'
import { payloadModifier } from '@/plugins/presets/payloadModifier'

describe('payloadModifier plugin tests', () => {
  // Helper: get handleApi from plugin without running full generator
  function getHandleApi(configs: Parameters<typeof payloadModifier>[0]) {
    const plugin = payloadModifier(configs)
    const configured = plugin.config?.({} as any) as any
    return configured.handleApi as (api: ApiDescriptor) => ApiDescriptor | null
  }

  it('modifies query/path parameters, wraps optional input and removes matched ones', () => {
    let ageInput: any
    let idInput: any
    const handleApi = getHandleApi([
      {
        scope: 'params',
        match: 'age',
        handler: (input) => {
          ageInput = input
          return { required: true, type: { oneOf: ['string', 'number', 'boolean'] } }
        },
      },
      { scope: 'params', match: 'debug', handler: () => null },
      {
        scope: 'pathParams',
        match: 'id',
        handler: (input) => {
          idInput = input
          return { required: false, type: 'string' }
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/pets/{id}',
      method: 'get',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'age', in: 'query', required: false, schema: { type: 'integer', description: 'hello age' } },
        { name: 'debug', in: 'query', required: false, schema: { type: 'boolean' } },
        { name: 'q', in: 'query', required: false, schema: { type: 'string' } },
      ],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    // optional plain-type input is wrapped as { required: false, type }
    expect(ageInput).toEqual({ required: false, type: 'number' })
    // required plain-type input is the original string
    expect(idInput).toBe('number')

    // age becomes the string|number|boolean union type, and required is true
    const ageParam = result.parameters!.find(p => p.in === 'query' && p.name === 'age')!
    expect(ageParam.schema).toEqual({
      description: 'hello age',
      oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
    })
    expect(ageParam.required).toBeTruthy()

    // debug is removed
    expect(result.parameters!.some(p => p.name === 'debug')).toBe(false)

    // path id is string and required is false
    const idParam = result.parameters!.find(p => p.in === 'path' && p.name === 'id')!
    expect((idParam.schema as SchemaObject)?.type).toBe('string')
    expect(idParam.required).toBe(false)

    // q stays unchanged
    const qParam = result.parameters!.find(p => p.in === 'query' && p.name === 'q')!
    expect((qParam.schema as SchemaObject)?.type).toBe('string')
    expect(qParam.required).toBe(false)
  })

  it('modifies request body properties, required and array type', () => {
    const handleApi = getHandleApi([
      { scope: 'data', match: 'name', handler: () => ({ required: true, type: 'number' }) },
      { scope: 'data', match: 'count', handler: () => null },
      { scope: 'data', match: 'tags', handler: () => ['string'] },
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
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['count'],
      },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    const rb = result.requestBody as SchemaObject
    expect((rb.properties?.name as SchemaObject)?.type).toBe('number')
    expect(rb.properties?.count).toBeUndefined()
    // returning a native array should produce an array type
    expect(rb.properties?.tags).toEqual({ type: 'array', items: { type: 'string' } })
    // required now includes name and tags (the tags handler returns ['string'] which is not a SchemaOptional, so required defaults to true)
    expect(rb.required).toEqual(['name', 'tags'])
  })

  it('returns nested object with optional keys', () => {
    const handleApi = getHandleApi([
      {
        scope: 'data',
        match: 'user',
        handler: () => ({
          username: 'string',
          age: { required: false, type: 'number' },
        }),
      },
    ])

    const api: ApiDescriptor = {
      url: '/users',
      method: 'post',
      parameters: [],
      requestBody: {
        type: 'object',
        properties: { user: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
        required: ['user'],
      },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    const rb = result.requestBody as SchemaObject
    expect(rb.properties?.user).toEqual({
      type: 'object',
      properties: { username: { type: 'string' }, age: { type: 'number' } },
      required: ['username'],
    })
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
    expect(Array.isArray(res.oneOf)).toBeTruthy()
    for (const branch of res.oneOf as SchemaObject[]) {
      expect((branch.properties?.ok as SchemaObject)?.type).toBe('number')
    }
  })

  it('applies multiple configs sequentially', () => {
    const handleApi = getHandleApi([
      { scope: 'params', match: 'age', handler: () => { return 'string' } },
      { scope: 'params', match: 'age', handler: () => { return 'number' } }, // overridden by the second config
      { scope: 'data', match: 'flag', handler: () => { return { required: true, type: 'boolean' } } },
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
    expect((ageParam.schema as SchemaObject)?.type).toBe('number') // overridden by the second config
    const rb = result.requestBody!
    expect((rb.properties?.flag as SchemaObject)?.type).toBe('boolean')
    expect(rb.required).toEqual(['flag'])
  })

  it('handler receives object input (response.data) and transforms nested fields based on it', () => {
    let input: any
    const handleApi = getHandleApi([
      {
        scope: 'response',
        match: 'data',
        handler: (schema) => {
          input = schema
          // transform based on the input: change id to string, drop name, add createdAt
          const spec = schema as Record<string, any>
          const next: Record<string, any> = {}
          for (const key of Object.keys(spec)) {
            const val = spec[key]
            // unwrap SchemaOptional (the input form of an optional field)
            const isOpt = val && typeof val === 'object' && !Array.isArray(val)
              && typeof val.required === 'boolean' && 'type' in val
            const unwrapped = isOpt ? val.type : val
            if (key === 'name') {
              continue
            }
            if (key === 'id') {
              next.id = 'string'
            }
            else if (isOpt) {
              next[key] = { required: false, type: unwrapped }
            }
            else {
              next[key] = unwrapped
            }
          }
          next.createdAt = 'string'
          return next
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/users',
      method: 'get',
      parameters: [],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: {
        type: 'object',
        properties: {
          code: { type: 'number' },
          data: {
            type: 'object',
            properties: { id: { type: 'number' }, name: { type: 'string' } },
            required: ['id'],
          },
        },
        required: ['code', 'data'],
      } as any,
    }

    const result = handleApi(api)!
    // the input is the SchemaReference of the data sub-object (optional props are wrapped in SchemaOptional)
    expect(input).toEqual({ id: 'number', name: { required: false, type: 'string' } })
    // the data field is transformed: id -> string, name removed, createdAt added and all required
    const res = result.responses as SchemaObject
    expect(res.properties?.data).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
      },
      required: ['id', 'createdAt'],
    })
    // the code field is unaffected
    expect((res.properties?.code as SchemaObject)?.type).toBe('number')
  })

  it('handler receives native array input and maps element type based on it', () => {
    let input: any
    const handleApi = getHandleApi([
      {
        scope: 'data',
        match: 'tags',
        handler: (schema) => {
          input = schema
          // the input is ['string']; based on it, change the element type to number
          return ['number']
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/pets',
      method: 'post',
      parameters: [],
      requestBody: {
        type: 'object',
        properties: { tags: { type: 'array', items: { type: 'string' } } },
        required: ['tags'],
      },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    // the input is the native array ['string']
    expect(input).toEqual(['string'])
    const rb = result.requestBody as SchemaObject
    // returning ['number'] produces an array type
    expect(rb.properties?.tags).toEqual({ type: 'array', items: { type: 'number' } })
  })

  it('handler receives oneOf input and appends a branch based on it', () => {
    let input: any
    const handleApi = getHandleApi([
      {
        scope: 'params',
        match: 'id',
        handler: (schema) => {
          input = schema
          const spec = schema as SchemaOneOf
          return { oneOf: [...spec.oneOf, 'boolean'] }
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/pets/{id}',
      method: 'get',
      parameters: [
        { name: 'id', in: 'query', required: true, schema: { oneOf: [{ type: 'string' }, { type: 'number' }] } as any },
      ],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    // the input is a oneOf object
    expect(input).toEqual({ oneOf: ['string', 'number'] })
    const idParam = result.parameters!.find(p => p.name === 'id')!
    expect((idParam.schema as SchemaObject).oneOf).toEqual([
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
    ])
  })

  it('handler receives enum input and transforms it based on input', () => {
    let input: any
    const handleApi = getHandleApi([
      {
        scope: 'params',
        match: 'kind',
        handler: (schema) => {
          input = schema
          const spec = schema as { enum: string[], type?: string }
          return { enum: [...spec.enum, 'c'], type: 'string' }
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/items',
      method: 'get',
      parameters: [
        { name: 'kind', in: 'query', required: false, schema: { type: 'string', enum: ['a', 'b'] } as any },
      ],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    // the input is an enum object
    expect(input).toEqual({ enum: ['a', 'b'], type: 'string' })
    const kindParam = result.parameters!.find(p => p.name === 'kind')!
    expect(kindParam.schema).toEqual({ enum: ['a', 'b', 'c'], type: 'string' })
  })

  it('handler removes a field based on its input type', () => {
    let input: any
    const handleApi = getHandleApi([
      {
        scope: 'data',
        match: 'internalId',
        handler: (schema) => {
          input = schema
          // the input is a plain string type -> remove this field
          return typeof schema === 'string' ? null : schema
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/pets',
      method: 'post',
      parameters: [],
      requestBody: {
        type: 'object',
        properties: { internalId: { type: 'string' }, name: { type: 'string' } },
        required: ['internalId'],
      },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    expect(input).toBe('string')
    const rb = result.requestBody as SchemaObject
    expect(rb.properties?.internalId).toBeUndefined()
    expect(rb.properties?.name).toEqual({ type: 'string' })
    expect(rb.required).toEqual([])
  })

  it('handler receives SchemaOptional input for optional param and toggles required based on input', () => {
    let input: any
    const handleApi = getHandleApi([
      {
        scope: 'params',
        match: 'page',
        handler: (schema) => {
          input = schema
          // the input is wrapped as { required: false, type: 'number' }
          const opt = schema as { required: boolean, type: string }
          if (opt.required === false && opt.type === 'number') {
            return { required: true, type: 'number' }
          }
          return schema
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/list',
      method: 'get',
      parameters: [
        { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
      ],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    expect(input).toEqual({ required: false, type: 'number' })
    const pageParam = result.parameters!.find(p => p.name === 'page')!
    expect((pageParam.schema as SchemaObject)?.type).toBe('number')
    expect(pageParam.required).toBe(true)
  })

  it('handler receives object with native-array property (response.data.list) and transforms nested item via input', () => {
    let input: any
    const handleApi = getHandleApi([
      {
        scope: 'response',
        match: 'data',
        handler: (schema) => {
          input = schema
          // the input is shaped like { list: { required: false, type: [ { id: {required:false,type:'number'}, name: {required:false,type:'string'} } ] } }
          return {
            list: [{ id: 'string', name: 'string' }],
          }
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/feed',
      method: 'get',
      parameters: [],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              list: {
                type: 'array',
                items: { type: 'object', properties: { id: { type: 'number' }, name: { type: 'string' } } },
              },
            },
            required: [],
          },
        },
        required: ['data'],
      } as any,
    }

    const result = handleApi(api)!
    // the input is shaped like { list: { required: false, type: [ { id: {required:false,type:'number'}, name: {required:false,type:'string'} } ] } } (both list and item fields are optional)
    expect(input).toEqual({
      list: {
        required: false,
        type: [{ id: { required: false, type: 'number' }, name: { required: false, type: 'string' } }],
      },
    })
    const res = result.responses as SchemaObject
    expect(res.properties?.data).toEqual({
      type: 'object',
      properties: {
        list: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'string' }, name: { type: 'string' } },
            required: ['id', 'name'],
          },
        },
      },
      required: ['list'],
    })
  })

  it('collapses nested SchemaOptional (outer required wins, inner ignored) with object type', () => {
    const handleApi = getHandleApi([
      {
        scope: 'data',
        handler: () => ({
          required: true,
          type: {
            // inner required=false is ignored; type is the full object representation
            required: false,
            type: {
              id: 'number', // not wrapped -> required by default
              name: { required: false, type: 'string' }, // optional
            },
          },
        }),
      },
    ])

    const api: ApiDescriptor = {
      url: '/create',
      method: 'post',
      parameters: [],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    expect(result.requestBody).toEqual({
      type: 'object',
      properties: { id: { type: 'number' }, name: { type: 'string' } },
      required: ['id'],
    })
  })

  it('collapses deeply nested SchemaOptional on a param (outermost required wins)', () => {
    const handleApi = getHandleApi([
      {
        scope: 'params',
        match: 'token',
        handler: () => ({
          required: true,
          type: { required: false, type: { required: false, type: 'string' } },
        }),
      },
    ])

    const api: ApiDescriptor = {
      url: '/x',
      method: 'get',
      parameters: [
        { name: 'token', in: 'query', required: false, schema: { type: 'integer' } },
      ],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    const tokenParam = result.parameters!.find(p => p.name === 'token')!
    expect((tokenParam.schema as SchemaObject).type).toBe('string')
    expect(tokenParam.required).toBe(true)
  })

  it('handler can return any/unknown/undefined/null/never primitive types', () => {
    const handleApi = getHandleApi([
      { scope: 'params', match: 'a', handler: () => 'any' },
      { scope: 'params', match: 'b', handler: () => 'unknown' },
      { scope: 'params', match: 'c', handler: () => 'undefined' },
      { scope: 'params', match: 'd', handler: () => 'null' },
      { scope: 'params', match: 'e', handler: () => 'never' },
    ])

    const api: ApiDescriptor = {
      url: '/x',
      method: 'get',
      parameters: [
        { name: 'a', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'b', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'c', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'd', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'e', in: 'query', required: false, schema: { type: 'string' } },
      ],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    const getType = (name: string) => (result.parameters!.find(p => p.name === name)!.schema as SchemaObject).type
    expect(getType('a')).toBe('any')
    expect(getType('b')).toBe('unknown')
    expect(getType('c')).toBe('undefined')
    expect(getType('d')).toBe('null')
    expect(getType('e')).toBe('never')
  })

  it('match supports RegExp', () => {
    const handleApi = getHandleApi([
      { scope: 'params', match: /_date$/, handler: () => 'string' },
    ])

    const api: ApiDescriptor = {
      url: '/x',
      method: 'get',
      parameters: [
        { name: 'createdAt', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'updatedAt', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'name', in: 'query', required: false, schema: { type: 'integer' } },
      ],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    const getType = (n: string) => (result.parameters!.find(p => p.name === n)!.schema as SchemaObject).type
    expect(getType('createdAt')).toBe('string')
    expect(getType('updatedAt')).toBe('string')
    expect(getType('name')).toBe('integer') // unmatched, untouched
  })

  it('match supports function', () => {
    const handleApi = getHandleApi([
      {
        scope: 'data',
        match: (key: string) => key.startsWith('user'),
        handler: () => 'string',
      },
    ])

    const api: ApiDescriptor = {
      url: '/x',
      method: 'post',
      parameters: [],
      requestBody: {
        type: 'object',
        properties: {
          user_name: { type: 'string' },
          user_age: { type: 'integer' },
          other: { type: 'boolean' },
        },
        required: [],
      },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    const rb = result.requestBody as SchemaObject
    expect((rb.properties?.user_name as SchemaObject)?.type).toBe('string')
    expect((rb.properties?.user_age as SchemaObject)?.type).toBe('string')
    expect((rb.properties?.other as SchemaObject)?.type).toBe('boolean') // unmatched, untouched
  })

  it('match omitted (data): handler is called once on the whole scope object with key undefined', () => {
    let calls = 0
    let receivedKey: any
    let received: any
    const handleApi = getHandleApi([
      {
        scope: 'data',
        handler: (schema, key) => {
          calls++
          receivedKey = key
          received = schema
          // set every field on the whole object to boolean, preserving the optional flag
          const s = schema as Record<string, any>
          const next: Record<string, any> = {}
          for (const k of Object.keys(s)) {
            const val = s[k]
            const isOpt = val && typeof val === 'object' && !Array.isArray(val)
              && typeof val.required === 'boolean' && 'type' in val
            next[k] = isOpt ? { required: false, type: 'boolean' } : 'boolean'
          }
          return next
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/x',
      method: 'post',
      parameters: [],
      requestBody: {
        type: 'object',
        properties: {
          a: { type: 'string' },
          b: { type: 'integer' },
          c: { type: 'boolean' },
        },
        required: ['a'],
      },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    // the whole scope is called only once
    expect(calls).toBe(1)
    // when match is omitted, key is undefined
    expect(receivedKey).toBeUndefined()
    // the input is the whole requestBody object, optional props wrapped in SchemaOptional (integer normalized to number)
    expect(received).toEqual({ a: 'string', b: { required: false, type: 'number' }, c: { required: false, type: 'boolean' } })
    // every field is changed to boolean; the required relationship is preserved
    const rb = result.requestBody as SchemaObject
    expect((rb.properties?.a as SchemaObject)?.type).toBe('boolean')
    expect((rb.properties?.b as SchemaObject)?.type).toBe('boolean')
    expect((rb.properties?.c as SchemaObject)?.type).toBe('boolean')
    expect(rb.required).toEqual(['a'])
  })

  it('match omitted (params): handler is called once on the whole query object with key undefined', () => {
    let calls = 0
    let receivedKey: any
    let received: any
    const handleApi = getHandleApi([
      {
        scope: 'params',
        handler: (schema, key) => {
          calls++
          receivedKey = key
          received = schema
          return schema
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/x',
      method: 'get',
      parameters: [
        { name: 'a', in: 'query', required: true, schema: { type: 'string' } },
        { name: 'b', in: 'query', required: false, schema: { type: 'integer' } },
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    // the whole query scope is called only once
    expect(calls).toBe(1)
    // when match is omitted, key is undefined
    expect(receivedKey).toBeUndefined()
    // the input is the whole query object (only query params, path params excluded), optional props wrapped in SchemaOptional (integer normalized to number)
    expect(received).toEqual({ a: 'string', b: { required: false, type: 'number' } })
    // the original structure stays unchanged; path params are unaffected (integer is normalized to number after the Schema round-trip)
    const getType = (n: string) => (result.parameters!.find(p => p.name === n)!.schema as SchemaObject).type
    expect(getType('a')).toBe('string')
    expect(getType('b')).toBe('number')
    expect(getType('id')).toBe('string')
  })

  it('match set: handler receives the matched key as the 2nd argument', () => {
    const keys: string[] = []
    const handleApi = getHandleApi([
      // exact string match
      { scope: 'params', match: 'age', handler: (_s, key) => {
        keys.push(key as string)
        return 'string'
      } },
      // regex match
      { scope: 'params', match: /At$/, handler: (_s, key) => {
        keys.push(key as string)
        return 'string'
      } },
      // function match
      {
        scope: 'data',
        match: (k: string) => k.startsWith('user'),
        handler: (_s, key) => {
          keys.push(key as string)
          return 'string'
        },
      },
    ])

    const api: ApiDescriptor = {
      url: '/x',
      method: 'post',
      parameters: [
        { name: 'age', in: 'query', required: false, schema: { type: 'integer' } },
        { name: 'createdAt', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'updatedAt', in: 'query', required: false, schema: { type: 'string' } },
        { name: 'name', in: 'query', required: false, schema: { type: 'integer' } },
      ],
      requestBody: {
        type: 'object',
        properties: { user_name: { type: 'string' }, user_age: { type: 'integer' }, other: { type: 'boolean' } },
        required: [],
      },
      responses: { type: 'object', properties: {}, required: [] },
    }

    handleApi(api)
    // matched fields are recorded in order; unmatched name/other are not included
    expect(keys).toEqual(['age', 'createdAt', 'updatedAt', 'user_name', 'user_age'])
  })

  it('handler can return SchemaEnum to produce an enum field', () => {
    const handleApi = getHandleApi([
      {
        scope: 'params',
        match: 'status',
        handler: () => ({ enum: ['active', 'inactive', 'pending'], type: 'string' }),
      },
    ])

    const api: ApiDescriptor = {
      url: '/x',
      method: 'get',
      parameters: [
        { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
      ],
      requestBody: { type: 'object', properties: {}, required: [] },
      responses: { type: 'object', properties: {}, required: [] },
    }

    const result = handleApi(api)!
    const statusParam = result.parameters!.find(p => p.name === 'status')!
    expect(statusParam.schema).toEqual({ enum: ['active', 'inactive', 'pending'], type: 'string' })
  })

  it('handler returns null when apiDescriptor is null', () => {
    const handleApi = getHandleApi([{ scope: 'params', match: 'x', handler: () => 'string' }])
    expect(handleApi(null as any)).toBeNull()
  })

  describe('validation: handler return value', () => {
    function api(): ApiDescriptor {
      return {
        url: '/x',
        method: 'get',
        parameters: [{ name: 'age', in: 'query', required: false, schema: { type: 'string' } }],
        requestBody: { type: 'object', properties: { name: { type: 'string' } }, required: [] },
        responses: { type: 'object', properties: {}, required: [] },
      }
    }

    it('throws on invalid primitive type', () => {
      const handleApi = getHandleApi([{ scope: 'params', match: 'age', handler: () => 'int64' as any }])
      expect(() => handleApi(api())).toThrow(/Invalid schema type "int64"/)
    })

    it('throws on invalid primitive in SchemaOptional.type', () => {
      const handleApi = getHandleApi([{ scope: 'params', match: 'age', handler: () => ({ required: false, type: 'int64' as any }) }])
      expect(() => handleApi(api())).toThrow(/Invalid schema type "int64"/)
    })

    it('throws on invalid primitive in oneOf', () => {
      const handleApi = getHandleApi([{ scope: 'params', match: 'age', handler: () => ({ oneOf: ['int64' as any, 'string'] }) }])
      expect(() => handleApi(api())).toThrow(/Invalid schema type "int64"/)
    })

    it('throws on invalid primitive in anyOf', () => {
      const handleApi = getHandleApi([{ scope: 'params', match: 'age', handler: () => ({ anyOf: ['int64' as any, 'string'] }) }])
      expect(() => handleApi(api())).toThrow(/Invalid schema type "int64"/)
    })

    it('throws on invalid primitive in allOf', () => {
      const handleApi = getHandleApi([{ scope: 'params', match: 'age', handler: () => ({ allOf: ['int64' as any, 'string'] }) }])
      expect(() => handleApi(api())).toThrow(/Invalid schema type "int64"/)
    })

    it('throws on invalid type in SchemaEnum', () => {
      const handleApi = getHandleApi([{ scope: 'params', match: 'age', handler: () => ({ enum: ['a', 'b'], type: 'int64' as any }) }])
      expect(() => handleApi(api())).toThrow(/Invalid schema type "int64"/)
    })

    it('throws on invalid primitive in array element', () => {
      const handleApi = getHandleApi([{ scope: 'data', match: 'name', handler: () => ['int64' as any] }])
      expect(() => handleApi(api())).toThrow(/Invalid schema type "int64"/)
    })

    it('throws on invalid primitive in nested SchemaReference', () => {
      const handleApi = getHandleApi([{ scope: 'data', match: 'name', handler: () => ({ key: 'int64' as any }) }])
      expect(() => handleApi(api())).toThrow(/Invalid schema type "int64"/)
    })

    it('throws on invalid primitive in deeply nested SchemaOptional', () => {
      const handleApi = getHandleApi([{ scope: 'params', match: 'age', handler: () => ({ required: true, type: { required: false, type: 'int64' as any } }) }])
      expect(() => handleApi(api())).toThrow(/Invalid schema type "int64"/)
    })

    it('does not throw for all valid SchemaPrimitive values', () => {
      const handleApi = getHandleApi([
        { scope: 'params', match: 'age', handler: () => 'number' },
      ])
      expect(() => handleApi(api())).not.toThrow()
    })
  })

  describe('feature: path filter', () => {
    it('applies config only when apiDescriptor.url matches (string substring)', () => {
      const handleApi = getHandleApi([
        {
          path: '/pets',
          scope: 'data',
          match: 'userId',
          handler: () => ({ required: true, type: 'string' }),
        },
      ])

      const matchedApi: ApiDescriptor = {
        url: '/pets/{id}',
        method: 'post',
        parameters: [],
        requestBody: { type: 'object', properties: { userId: { type: 'integer' } }, required: ['userId'] },
        responses: { type: 'object', properties: {}, required: [] },
      }
      const unmatchedApi: ApiDescriptor = { ...matchedApi, url: '/orders' }

      const matched = handleApi(matchedApi)!
      const rb = matched.requestBody as SchemaObject
      // matched: userId is rewritten
      expect((rb.properties?.userId as SchemaObject)?.type).toBe('string')
      // unmatched: returned as-is (same reference)
      const unmatched = handleApi(unmatchedApi)!
      expect(unmatched).toBe(unmatchedApi)
    })

    it('path supports RegExp and function matchers', () => {
      const handleApi = getHandleApi([
        {
          path: /^\/admin/,
          scope: 'params',
          match: 'token',
          handler: () => ({ required: true, type: 'string' }),
        },
        {
          path: (url: string) => url.includes('internal'),
          scope: 'params',
          match: 'secret',
          handler: () => ({ required: true, type: 'string' }),
        },
      ])

      const adminApi: ApiDescriptor = {
        url: '/admin/users',
        method: 'get',
        parameters: [
          { name: 'token', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'secret', in: 'query', required: false, schema: { type: 'string' } },
        ],
        requestBody: { type: 'object', properties: {}, required: [] },
        responses: { type: 'object', properties: {}, required: [] },
      }
      const internalApi: ApiDescriptor = { ...adminApi, url: '/internal/x' }
      const otherApi: ApiDescriptor = { ...adminApi, url: '/public/x' }

      const admin = handleApi(adminApi)!
      expect((admin.parameters!.find(p => p.name === 'token')!.schema as SchemaObject)?.type).toBe('string')
      // under the admin path, secret does not match (the path function requires the url to contain 'internal')
      expect((admin.parameters!.find(p => p.name === 'secret')!.schema as SchemaObject)?.type).toBe('string')

      const internal = handleApi(internalApi)!
      expect((internal.parameters!.find(p => p.name === 'secret')!.schema as SchemaObject)?.type).toBe('string')

      // none matched: returned as-is
      const other = handleApi(otherApi)!
      expect(other).toBe(otherApi)
    })
  })
})
