import { vol } from 'memfs'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('readAlovaRc', () => {
  beforeEach(() => {
    vol.reset()
  })

  it('should return null when .alovarc file does not exist', async () => {
    const { readAlovaRc } = await import('@/functions/readAlovaRc')
    const result = await readAlovaRc('/project')
    expect(result).toBeNull()
  })

  it('should parse a simple single-line URL with default template (alovaGlobals)', async () => {
    vol.fromJSON({ '/project/.alovarc': 'https://example.com/openapi.json\n' })
    const { readAlovaRc } = await import('@/functions/readAlovaRc')
    const result = await readAlovaRc('/project')
    expect(result).not.toBeNull()
    expect(result!.generator).toHaveLength(1)
    expect(result!.generator[0].input).toBe('https://example.com/openapi.json')
    expect(result!.generator[0].output).toBe('src/api')
  })

  it('should parse multiple URLs with incremented output folders', async () => {
    vol.fromJSON({
      '/project/.alovarc': 'https://a.com/api.json\nhttps://b.com/api.json\nhttps://c.com/api.json\n',
    })
    const { readAlovaRc } = await import('@/functions/readAlovaRc')
    const result = await readAlovaRc('/project')
    expect(result!.generator).toHaveLength(3)
    expect(result!.generator[0].output).toBe('src/api')
    expect(result!.generator[1].output).toBe('src/api2')
    expect(result!.generator[2].output).toBe('src/api3')
  })

  it('should parse template type after comma', async () => {
    vol.fromJSON({ '/project/.alovarc': 'https://a.com/api.json, axios\n' })
    const { readAlovaRc } = await import('@/functions/readAlovaRc')
    const result = await readAlovaRc('/project')
    expect(result!.generator).toHaveLength(1)
    expect(result!.generator[0].plugins).toBeDefined()
  })

  it('should parse key=url format to set custom output folder', async () => {
    vol.fromJSON({ '/project/.alovarc': 'myApi=https://a.com/api.json\n' })
    const { readAlovaRc } = await import('@/functions/readAlovaRc')
    const result = await readAlovaRc('/project')
    expect(result!.generator[0].output).toBe('src/myApi')
  })

  it('should use outputKey with "/" as direct relative path (not prefixed with src/)', async () => {
    vol.fromJSON({ '/project/.alovarc': 'public/myApi=https://a.com/api.json\n' })
    const { readAlovaRc } = await import('@/functions/readAlovaRc')
    const result = await readAlovaRc('/project')
    expect(result!.generator[0].output).toBe('public/myApi')
  })

  it('should ignore # comment lines', async () => {
    vol.fromJSON({
      '/project/.alovarc': '# This is a comment\nhttps://a.com/api.json\n# Another comment\n',
    })
    const { readAlovaRc } = await import('@/functions/readAlovaRc')
    const result = await readAlovaRc('/project')
    expect(result!.generator).toHaveLength(1)
  })

  it('should ignore // inline comments', async () => {
    vol.fromJSON({
      '/project/.alovarc': 'https://a.com/api.json // my server\n',
    })
    const { readAlovaRc } = await import('@/functions/readAlovaRc')
    const result = await readAlovaRc('/project')
    expect(result!.generator[0].input).toBe('https://a.com/api.json')
  })

  it('should ignore empty lines', async () => {
    vol.fromJSON({ '/project/.alovarc': '\n\nhttps://a.com/api.json\n\n' })
    const { readAlovaRc } = await import('@/functions/readAlovaRc')
    const result = await readAlovaRc('/project')
    expect(result!.generator).toHaveLength(1)
  })

  it('should return null when file has only comments and empty lines', async () => {
    vol.fromJSON({ '/project/.alovarc': '# comment\n\n# another\n' })
    const { readAlovaRc } = await import('@/functions/readAlovaRc')
    const result = await readAlovaRc('/project')
    expect(result).toBeNull()
  })
})
