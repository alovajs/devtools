import { diffSourceDocument } from '@/functions/diffDocument'

/** Minimal operation object shared by the fixtures. */
function op(extra: Record<string, any> = {}) {
  return { tags: ['pets'], summary: 'list pets', responses: { 200: { description: 'ok' } }, ...extra }
}

function queryParam(name: string, extra: Record<string, any> = {}) {
  return { in: 'query', name, schema: { type: 'string' }, ...extra }
}

/** Build a source document; `extra` merges into the root (components, info, ...). */
function doc(paths: Record<string, any>, extra: Record<string, any> = {}) {
  return {
    openapi: '3.0.0',
    info: { title: 'Demo', version: '1.0.0' },
    paths,
    ...extra,
  }
}

describe('diffSourceDocument()', () => {
  it('returns nothing for structurally identical documents', () => {
    const before = doc({ '/pets': { get: op({ operationId: 'listPets' }) } })
    const after = doc({ '/pets': { get: op({ operationId: 'listPets' }) } })

    expect(diffSourceDocument(before, after)).toEqual([])
  })

  it('reports added and removed operations', () => {
    const before = doc({ '/pets': { get: op({ operationId: 'listPets' }) } })
    const after = doc({ '/pets': { post: op({ operationId: 'createPet' }) } })

    const rows = diffSourceDocument(before, after)
    expect(rows.map(row => `${row.op} ${row.target}`).sort()).toEqual(['+ POST /pets', '- GET /pets'])
    expect(rows.find(row => row.op === '+')).toEqual({
      op: '+',
      kind: 'api',
      target: 'POST /pets',
      detail: 'createPet',
      level: 'additive',
    })
    expect(rows.find(row => row.op === '-')).toEqual({
      op: '-',
      kind: 'api',
      target: 'GET /pets',
      detail: 'listPets',
      level: 'breaking',
    })
  })

  it('reports an operationId rename as a breaking api change', () => {
    const before = doc({ '/pets': { get: op({ operationId: 'listPets' }) } })
    const after = doc({ '/pets': { get: op({ operationId: 'fetchPets' }) } })

    expect(diffSourceDocument(before, after)).toEqual([{
      op: '~',
      kind: 'api',
      target: 'GET /pets',
      item: 'operationId',
      detail: '"listPets" -> "fetchPets"',
      level: 'breaking',
    }])
  })

  it('reports parameter additions, removals and value-definition changes', () => {
    const before = doc({
      '/pets': {
        get: op({
          parameters: [
            queryParam('limit'),
            queryParam('status', { schema: { type: 'string', enum: ['available', 'pending'] } }),
            queryParam('offset'),
          ],
        }),
      },
    })
    const after = doc({
      '/pets': {
        get: op({
          parameters: [
            queryParam('limit', { required: true }),
            queryParam('status', { schema: { type: 'string', enum: ['available', 'pending', 'sold'] } }),
            queryParam('keyword'),
          ],
        }),
      },
    })

    const rows = diffSourceDocument(before, after)
    // parameters are keyed by `in` + `name`, so rows follow that order:
    // keyword → limit → offset → status
    expect(rows).toEqual([
      // a new optional parameter is compatible
      { op: '+', kind: 'param', target: 'GET /pets', item: 'query.keyword', detail: 'string?', level: 'additive' },
      // a newly required parameter breaks callers
      { op: '+', kind: 'param', target: 'GET /pets', item: 'query.limit.required', detail: 'true', level: 'breaking' },
      { op: '-', kind: 'param', target: 'GET /pets', item: 'query.offset', level: 'breaking' },
      // a new enum value is compatible
      { op: '+', kind: 'param', target: 'GET /pets', item: 'query.status.schema.enum', detail: '+"sold"', level: 'additive' },
    ])
  })

  it('reports a parameter type change and a removed enum value as breaking', () => {
    const before = doc({
      '/pets': {
        get: op({ parameters: [queryParam('limit', { schema: { type: 'string', enum: ['a', 'b'] } })] }),
      },
    })
    const after = doc({
      '/pets': {
        get: op({ parameters: [queryParam('limit', { schema: { type: 'integer', enum: ['a'] } })] }),
      },
    })

    const rows = diffSourceDocument(before, after)
    expect(rows).toContainEqual({
      op: '~',
      kind: 'param',
      target: 'GET /pets',
      item: 'query.limit.schema.type',
      detail: '"string" -> "integer"',
      level: 'breaking',
    })
    expect(rows).toContainEqual({
      op: '-',
      kind: 'param',
      target: 'GET /pets',
      item: 'query.limit.schema.enum',
      detail: '-"b"',
      level: 'breaking',
    })
  })

  it('labels description-only parameter changes as `doc`', () => {
    const before = doc({ '/pets': { get: op({ parameters: [queryParam('limit', { description: 'old' })] }) } })
    const after = doc({ '/pets': { get: op({ parameters: [queryParam('limit', { description: 'new' })] }) } })

    expect(diffSourceDocument(before, after)).toEqual([{
      op: '~',
      kind: 'param',
      target: 'GET /pets',
      item: 'query.limit.description',
      detail: '"old" -> "new"',
      level: 'doc',
    }])
  })

  it('includes path-item level parameters in the effective parameter set', () => {
    const before = doc({ '/pets': { parameters: [queryParam('limit')], get: op() } })
    const after = doc({ '/pets': { parameters: [queryParam('limit', { required: true })], get: op() } })

    expect(diffSourceDocument(before, after)).toEqual([{
      op: '+',
      kind: 'param',
      target: 'GET /pets',
      item: 'query.limit.required',
      detail: 'true',
      level: 'breaking',
    }])
  })

  it('reports request body schema changes as `body` rows', () => {
    const body = (type: string) => ({ content: { 'application/json': { schema: { type: 'object', properties: { name: { type } } } } } })
    const before = doc({ '/pets': { post: op({ requestBody: body('string') }) } })
    const after = doc({ '/pets': { post: op({ requestBody: body('integer') }) } })

    expect(diffSourceDocument(before, after)).toEqual([{
      op: '~',
      kind: 'body',
      target: 'POST /pets',
      item: 'requestBody.application/json.properties.name.type',
      detail: '"string" -> "integer"',
      level: 'breaking',
    }])
  })

  it('reports response additions, removals and content changes', () => {
    const before = doc({ '/pets': { get: op({ responses: { 200: { description: 'ok' }, 404: { description: 'missing' } } }) } })
    const after = doc({
      '/pets': {
        get: op({
          responses: {
            200: { description: 'ok', content: { 'application/json': { schema: { type: 'string' } } } },
          },
        }),
      },
    })

    const rows = diffSourceDocument(before, after)
    expect(rows).toContainEqual({ op: '-', kind: 'resp', target: 'GET /pets', item: 'responses.404', detail: '{description}', level: 'breaking' })
    expect(rows).toContainEqual({ op: '+', kind: 'resp', target: 'GET /pets', item: 'responses.200.application/json', detail: '{schema}', level: 'additive' })
  })

  it('reports a component change once, listing its affected operations', () => {
    const pet = (statusValues: string[]) => ({ type: 'object', properties: { status: { type: 'string', enum: statusValues } } })
    const paths = {
      '/pets': { get: op({ responses: { 200: { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } } } }) },
      '/pets/{id}': { get: op({ responses: { 200: { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } } } }) },
    }
    const before = doc(paths, { components: { schemas: { Pet: pet(['available', 'pending']) } } })
    const after = doc(paths, { components: { schemas: { Pet: pet(['available', 'pending', 'sold']) } } })

    expect(diffSourceDocument(before, after)).toEqual([{
      op: '+',
      kind: 'comp',
      // the component is the target, the changed field the item
      target: '#/components/schemas/Pet',
      item: 'properties.status.enum',
      detail: '+"sold"',
      level: 'additive',
      affects: ['GET /pets', 'GET /pets/{id}'],
    }])
  })

  it('reports added and removed components with their affected operations', () => {
    const paths = {
      '/pets': { get: op({ responses: { 200: { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } } } }) },
    }
    const before = doc(paths, { components: { schemas: { Pet: { type: 'object' }, Legacy: { type: 'string' } } } })
    const after = doc(paths, { components: { schemas: { Pet: { type: 'object' }, Added: { type: 'object' } } } })

    const rows = diffSourceDocument(before, after)
    expect(rows).toContainEqual({
      op: '+',
      kind: 'comp',
      target: '#/components/schemas/Added',
      detail: '{type}',
      level: 'additive',
    })
    expect(rows).toContainEqual({
      op: '-',
      kind: 'comp',
      target: '#/components/schemas/Legacy',
      detail: '{type}',
      level: 'breaking',
    })
  })

  it('follows transitive component references when resolving the impact', () => {
    const paths = {
      '/pets': { get: op({ responses: { 200: { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } } } }) },
    }
    const schemasOf = (categoryType: string) => ({
      Pet: { type: 'object', properties: { category: { $ref: '#/components/schemas/Category' } } },
      Category: { type: 'object', properties: { name: { type: categoryType } } },
    })
    const before = doc(paths, { components: { schemas: schemasOf('string') } })
    const after = doc(paths, { components: { schemas: schemasOf('integer') } })

    expect(diffSourceDocument(before, after)).toEqual([{
      op: '~',
      kind: 'comp',
      target: '#/components/schemas/Category',
      item: 'properties.name.type',
      detail: '"string" -> "integer"',
      level: 'breaking',
      affects: ['GET /pets'],
    }])
  })

  it('keeps the component ref as target and omits `affects` when nothing references it', () => {
    const before = doc({ '/pets': { get: op() } }, { components: { schemas: { Unused: { type: 'object' } } } })
    const after = doc({ '/pets': { get: op() } }, { components: { schemas: { Unused: { type: 'object', title: 'x' } } } })

    expect(diffSourceDocument(before, after)).toEqual([{
      op: '+',
      kind: 'comp',
      target: '#/components/schemas/Unused',
      item: 'title',
      detail: '"x"',
      level: 'doc',
    }])
  })

  it('reports document-global (meta) changes', () => {
    const before = doc({}, { info: { title: 'Demo', version: '1.0.0' } })
    const after = doc({}, { info: { title: 'Demo', version: '1.1.0' } })

    expect(diffSourceDocument(before, after)).toEqual([{
      op: '~',
      kind: 'meta',
      target: '#/info',
      item: 'info.version',
      detail: '"1.0.0" -> "1.1.0"',
      level: 'breaking',
    }])
  })

  it('produces a deterministic row order', () => {
    const before = doc({ '/b': { get: op() }, '/a': { get: op() } })
    const after = doc({ '/b': { get: op() }, '/a': { get: op() }, '/c': { get: op() } })

    const first = diffSourceDocument(before, after)
    const second = diffSourceDocument(before, after)
    expect(first.map(row => row.target)).toEqual(['GET /c'])
    expect(second).toEqual(first)
  })
})
