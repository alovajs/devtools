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
    // 可选普通类型入参被包裹为 { required: false, type }
    expect(ageInput).toEqual({ required: false, type: 'number' })
    // 必填普通类型入参为原始字符串
    expect(idInput).toBe('number')

    // age 转为 string|number|boolean 联合类型，且 required 为 true
    const ageParam = result.parameters!.find(p => p.in === 'query' && p.name === 'age')!
    expect(ageParam.schema).toEqual({
      description: 'hello age',
      oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
    })
    expect(ageParam.required).toBeTruthy()

    // debug 被移除
    expect(result.parameters!.some(p => p.name === 'debug')).toBe(false)

    // path id 为 string 且 required 为 false
    const idParam = result.parameters!.find(p => p.in === 'path' && p.name === 'id')!
    expect((idParam.schema as SchemaObject)?.type).toBe('string')
    expect(idParam.required).toBe(false)

    // q 保持不变
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
    // 返回原生数组应生成 array 类型
    expect(rb.properties?.tags).toEqual({ type: 'array', items: { type: 'string' } })
    // required 现在只包含 name
    expect(rb.required).toEqual(['name'])
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
      { scope: 'params', match: 'age', handler: () => { return 'number' } }, // 被第二个 config 覆盖
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
    expect((ageParam.schema as SchemaObject)?.type).toBe('number') // 被第二个 config 覆盖
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
          // 基于入参做转换：id 改为 string，去掉 name，新增 createdAt
          const spec = schema as Record<string, any>
          const next: Record<string, any> = {}
          for (const key of Object.keys(spec)) {
            const val = spec[key]
            // 解包 SchemaOptional（可选字段的入参形式）
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
    // 入参为 data 子对象的 SchemaReference（可选属性用 SchemaOptional 包装）
    expect(input).toEqual({ id: 'number', name: { required: false, type: 'string' } })
    // data 字段被转换：id -> string，name 移除，新增 createdAt 且均为必填
    const res = result.responses as SchemaObject
    expect(res.properties?.data).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
      },
      required: ['id', 'createdAt'],
    })
    // code 字段未受影响
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
          // 入参为 ['string']，基于它把元素类型改为 number
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
    // 入参为原生数组 ['string']
    expect(input).toEqual(['string'])
    const rb = result.requestBody as SchemaObject
    // 返回 ['number'] 生成 array 类型
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
    // 入参为 oneOf 对象
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
    // 入参为 enum 对象
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
          // 入参为 string 普通类型 -> 移除该字段
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
          // 入参被包裹为 { required: false, type: 'number' }
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
          // 入参形如 { list: { required: false, type: [ { id: {required:false,type:'number'}, name: {required:false,type:'string'} } ] } }
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
    // 入参形如 { list: { required: false, type: [ { id: {required:false,type:'number'}, name: {required:false,type:'string'} } ] } }（list 与 item 字段均为可选）
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
          // 在整体对象上把每个字段都改成 boolean，保留可选标记
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
    // 整个 scope 只调用一次
    expect(calls).toBe(1)
    // match 省略时 key 为 undefined
    expect(receivedKey).toBeUndefined()
    // 入参为整个 requestBody 对象，可选属性用 SchemaOptional 包装（integer 规范为 number）
    expect(received).toEqual({ a: 'string', b: { required: false, type: 'number' }, c: { required: false, type: 'boolean' } })
    // 每个字段都被改成 boolean，必填关系保持不变
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
    // 整个 query scope 只调用一次
    expect(calls).toBe(1)
    // match 省略时 key 为 undefined
    expect(receivedKey).toBeUndefined()
    // 入参为整个 query 对象（仅 query 参数，path 参数不在此列），可选属性用 SchemaOptional 包装（integer 规范为 number）
    expect(received).toEqual({ a: 'string', b: { required: false, type: 'number' } })
    // 原结构保持不变，path 参数不受影响（integer 经 Schema 表示往返后规范为 number）
    const getType = (n: string) => (result.parameters!.find(p => p.name === n)!.schema as SchemaObject).type
    expect(getType('a')).toBe('string')
    expect(getType('b')).toBe('number')
    expect(getType('id')).toBe('string')
  })

  it('match set: handler receives the matched key as the 2nd argument', () => {
    const keys: string[] = []
    const handleApi = getHandleApi([
      // 字符串精确匹配
      { scope: 'params', match: 'age', handler: (_s, key) => {
        keys.push(key as string)
        return 'string'
      } },
      // 正则匹配
      { scope: 'params', match: /At$/, handler: (_s, key) => {
        keys.push(key as string)
        return 'string'
      } },
      // 函数匹配
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
    // 命中的字段按顺序记录，未命中的 name/other 不在其中
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
})
