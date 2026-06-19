import { vol } from 'memfs'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('cache file (.worma-cache/)', () => {
  beforeEach(() => {
    vol.reset()
    vol.mkdirSync('/project', { recursive: true })
  })

  describe('writeCacheEntry', () => {
    it('should write cache as a .worma-cache/ directory at project root', { timeout: 15000 }, async () => {
      const { writeCacheEntry } = await import('@/functions/wormaJson')
      const apis = [
        { tag: 'user', method: 'GET', summary: 'Get user', path: '/user', pathParameters: '', queryParameters: '', name: 'getUser', responseName: 'User', pathKey: 'user.getUser' },
      ]
      const hashInfo = { hash: 'abc123', tags: { user: 'def456' } }
      await writeCacheEntry('/project', 'src/api', 'Test Server', apis, hashInfo)

      const indexContent = vol.readFileSync('/project/.worma-cache/index.json', 'utf-8') as string
      expect(indexContent).toBeDefined()
      const parsed = JSON.parse(indexContent)
      expect(Array.isArray(parsed.entries)).toBeTruthy()
    })

    it('should write entry with path and serverName', async () => {
      const { writeCacheEntry } = await import('@/functions/wormaJson')
      const apis = [
        { tag: 'user', method: 'GET', summary: 'Get user', path: '/user', pathParameters: '', queryParameters: '', name: 'getUser', responseName: 'User', pathKey: 'user.getUser' },
      ]
      const hashInfo = { hash: 'abc123', tags: { user: 'def456' } }
      await writeCacheEntry('/project', 'src/api', 'My Server', apis, hashInfo)

      const content = JSON.parse(vol.readFileSync('/project/.worma-cache/index.json', 'utf-8') as string)
      expect(content.entries[0].path).toBe('src/api')
      expect(content.entries[0].serverName).toBe('My Server')
      expect(content.entries[0].hash).toBe('abc123')
    })

    it('should merge entries when writing to an existing cache', async () => {
      const existingIndex = JSON.stringify({
        schemaVersion: 1,
        entries: [
          { path: 'src/api', serverName: 'Old', hash: 'old', tags: {} },
          { path: 'src/api2', serverName: 'Other', hash: 'other', tags: {} },
        ],
      })
      vol.mkdirSync('/project/.worma-cache', { recursive: true })
      vol.writeFileSync('/project/.worma-cache/index.json', existingIndex)
      // Also need to create the data files
      vol.mkdirSync('/project/.worma-cache/data', { recursive: true })
      vol.writeFileSync('/project/.worma-cache/data/src_api.json', JSON.stringify({ serverName: 'Old', apis: [] }))
      vol.writeFileSync('/project/.worma-cache/data/src_api2.json', JSON.stringify({ serverName: 'Other', apis: [] }))

      const { writeCacheEntry } = await import('@/functions/wormaJson')
      const hashInfo = { hash: 'new', tags: { admin: 'taghash' } }
      await writeCacheEntry('/project', 'src/api', 'Updated', [], hashInfo)

      const content = JSON.parse(vol.readFileSync('/project/.worma-cache/index.json', 'utf-8') as string)
      expect(content.entries).toHaveLength(2)
      const apiEntry = content.entries.find((e: any) => e.path === 'src/api')
      expect(apiEntry.serverName).toBe('Updated')
      expect(apiEntry.hash).toBe('new')
      const api2Entry = content.entries.find((e: any) => e.path === 'src/api2')
      expect(api2Entry.serverName).toBe('Other')
    })

    it('should sort entries by path for stable output', async () => {
      const { writeCacheEntry } = await import('@/functions/wormaJson')
      await writeCacheEntry('/project', 'src/api2', 'B', [], { hash: 'b', tags: {} })
      await writeCacheEntry('/project', 'src/api', 'A', [], { hash: 'a', tags: {} })
      const content = JSON.parse(vol.readFileSync('/project/.worma-cache/index.json', 'utf-8') as string)
      expect(content.entries[0].path).toBe('src/api')
      expect(content.entries[1].path).toBe('src/api2')
    })
  })

  describe('readCacheIndex', () => {
    it('should read and parse .worma-cache/index.json', async () => {
      const indexData = { schemaVersion: 1, entries: [{ path: 'src/api', serverName: 'Test', hash: 'abc', tags: {} }] }
      vol.mkdirSync('/project/.worma-cache', { recursive: true })
      vol.writeFileSync('/project/.worma-cache/index.json', JSON.stringify(indexData))
      const { readCacheIndex } = await import('@/functions/wormaJson')
      const result = await readCacheIndex('/project')
      expect(result).toEqual(indexData)
    })

    it('should return null when file does not exist', async () => {
      const { readCacheIndex } = await import('@/functions/wormaJson')
      const result = await readCacheIndex('/project')
      expect(result).toBeNull()
    })
  })

  describe('readCacheApis', () => {
    it('should return null when no cache exists', async () => {
      const { readCacheApis } = await import('@/functions/wormaJson')
      const result = await readCacheApis('/project', 'src/api')
      expect(result).toBeNull()
    })
  })
})
