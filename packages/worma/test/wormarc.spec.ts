import { vol } from 'memfs'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('readWormaRc', () => {
  beforeEach(() => {
    vol.reset()
  })

  it('should return null when .wormarc file does not exist', async () => {
    const { readWormaRc } = await import('@/functions/readWormaRc')
    const result = await readWormaRc('/project')
    expect(result).toBeNull()
  })

  it('should parse a simple single-line URL with default template (alovaGlobals)', async () => {
    vol.fromJSON({ '/project/.wormarc': 'https://example.com/openapi.json\n' })
    const { readWormaRc } = await import('@/functions/readWormaRc')
    const result = await readWormaRc('/project')
    expect(result).not.toBeNull()
    expect(result!.generator).toHaveLength(1)
    expect(result!.generator[0].input).toBe('https://example.com/openapi.json')
    expect(result!.generator[0].output).toBe('src/api')
  })

  it('should parse multiple URLs with incremented output folders', async () => {
    vol.fromJSON({
      '/project/.wormarc': 'https://a.com/api.json\nhttps://b.com/api.json\nhttps://c.com/api.json\n',
    })
    const { readWormaRc } = await import('@/functions/readWormaRc')
    const result = await readWormaRc('/project')
    expect(result!.generator).toHaveLength(3)
    expect(result!.generator[0].output).toBe('src/api')
    expect(result!.generator[1].output).toBe('src/api2')
    expect(result!.generator[2].output).toBe('src/api3')
  })

  it('should parse template type after comma', async () => {
    vol.fromJSON({ '/project/.wormarc': 'https://a.com/api.json, axios\n' })
    const { readWormaRc } = await import('@/functions/readWormaRc')
    const result = await readWormaRc('/project')
    expect(result!.generator).toHaveLength(1)
    expect(result!.generator[0].plugins).toBeDefined()
  })

  it('should parse key=url format to set custom output folder', async () => {
    vol.fromJSON({ '/project/.wormarc': 'myApi=https://a.com/api.json\n' })
    const { readWormaRc } = await import('@/functions/readWormaRc')
    const result = await readWormaRc('/project')
    expect(result!.generator[0].output).toBe('src/myApi')
  })

  it('should use outputKey with "/" as direct relative path (not prefixed with src/)', async () => {
    vol.fromJSON({ '/project/.wormarc': 'public/myApi=https://a.com/api.json\n' })
    const { readWormaRc } = await import('@/functions/readWormaRc')
    const result = await readWormaRc('/project')
    expect(result!.generator[0].output).toBe('public/myApi')
  })

  it('should ignore # comment lines', async () => {
    vol.fromJSON({
      '/project/.wormarc': '# This is a comment\nhttps://a.com/api.json\n# Another comment\n',
    })
    const { readWormaRc } = await import('@/functions/readWormaRc')
    const result = await readWormaRc('/project')
    expect(result!.generator).toHaveLength(1)
  })

  it('should ignore // inline comments', async () => {
    vol.fromJSON({
      '/project/.wormarc': 'https://a.com/api.json // my server\n',
    })
    const { readWormaRc } = await import('@/functions/readWormaRc')
    const result = await readWormaRc('/project')
    expect(result!.generator[0].input).toBe('https://a.com/api.json')
  })

  it('should ignore empty lines', async () => {
    vol.fromJSON({ '/project/.wormarc': '\n\nhttps://a.com/api.json\n\n' })
    const { readWormaRc } = await import('@/functions/readWormaRc')
    const result = await readWormaRc('/project')
    expect(result!.generator).toHaveLength(1)
  })

  it('should return null when file has only comments and empty lines', async () => {
    vol.fromJSON({ '/project/.wormarc': '# comment\n\n# another\n' })
    const { readWormaRc } = await import('@/functions/readWormaRc')
    const result = await readWormaRc('/project')
    expect(result).toBeNull()
  })
})

describe('resolveConfigFile with .wormarc', () => {
  beforeEach(() => {
    vol.reset()
  })

  it('should return .wormarc when it exists and no worma.config.* is present', async () => {
    vol.fromJSON({ '/project/.wormarc': 'https://example.com/openapi.json\n' })
    const { resolveConfigFile } = await import('@/utils')
    const result = await resolveConfigFile('/project')
    expect(result).toBe('/project/.wormarc')
  })

  it('should prioritize worma.config.ts over .wormarc', async () => {
    vol.fromJSON({
      '/project/worma.config.ts': '',
      '/project/.wormarc': 'https://example.com/openapi.json\n',
    })
    const { resolveConfigFile } = await import('@/utils')
    const result = await resolveConfigFile('/project')
    expect(result).toBe('/project/worma.config.ts')
  })

  it('should prioritize worma.config.js over .wormarc', async () => {
    vol.fromJSON({
      '/project/worma.config.js': '',
      '/project/.wormarc': 'https://example.com/openapi.json\n',
    })
    const { resolveConfigFile } = await import('@/utils')
    const result = await resolveConfigFile('/project')
    expect(result).toBe('/project/worma.config.js')
  })

  it('should return .wormarc when only .wormarc exists (no worma.config.*)', async () => {
    vol.fromJSON({
      '/project/package.json': '{}',
      '/project/.wormarc': 'https://example.com/openapi.json\n',
    })
    const { resolveConfigFile } = await import('@/utils')
    const result = await resolveConfigFile('/project')
    expect(result).toBe('/project/.wormarc')
  })

  it('should return null when neither .wormarc nor worma.config.* exist', async () => {
    vol.fromJSON({
      '/project/package.json': '{}',
    })
    const { resolveConfigFile } = await import('@/utils')
    const result = await resolveConfigFile('/project')
    expect(result).toBeNull()
  })
})
