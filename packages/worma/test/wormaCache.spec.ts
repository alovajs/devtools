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
        { tag: 'user', method: 'GET', summary: 'Get user', path: '/user', pathParameters: '', queryParameters: '', name: 'getUser', response: 'User' },
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
        { tag: 'user', method: 'GET', summary: 'Get user', path: '/user', pathParameters: '', queryParameters: '', name: 'getUser', response: 'User' },
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

    it('should return matching entry from cache', async () => {
      const { writeCacheEntry, readCacheApis } = await import('@/functions/wormaJson')
      const apis = [
        { tag: 'user', method: 'GET', summary: 'Get user', path: '/user', pathParameters: '', queryParameters: '', name: 'getUser', response: 'User' },
      ]
      await writeCacheEntry('/project', 'src/api/users', 'User Server', apis, { hash: 'abc', tags: { user: 'def' } })
      const result = await readCacheApis('/project', 'src/api/users')
      expect(result).not.toBeNull()
      expect(result!.path).toBe('src/api/users')
      expect(result!.serverName).toBe('User Server')
      expect(result!.apis).toHaveLength(1)
    })
  })

  describe('readAllCacheApis', () => {
    it('should return all entries from cache', async () => {
      const { writeCacheEntry, readAllCacheApis } = await import('@/functions/wormaJson')
      await writeCacheEntry('/project', 'src/api/users', 'User Server', [
        { tag: 'user', method: 'GET', summary: 'Get user', path: '/user', pathParameters: '', queryParameters: '', name: 'getUser', response: 'User' },
      ], { hash: 'abc', tags: { user: 'def' } })
      await writeCacheEntry('/project', 'src/api/admin', 'Admin Server', [
        { tag: 'admin', method: 'POST', summary: 'Create admin', path: '/admin', pathParameters: '', queryParameters: '', name: 'createAdmin', response: 'Admin' },
      ], { hash: 'xyz', tags: { admin: 'uvw' } })

      const results = await readAllCacheApis('/project')
      expect(results).toHaveLength(2)
      expect(results.map(r => r.path).sort()).toEqual(['src/api/admin', 'src/api/users'])
      expect(results.map(r => r.serverName).sort()).toEqual(['Admin Server', 'User Server'])
      expect(results.find(r => r.path === 'src/api/users')!.apis).toHaveLength(1)
    })

    it('should return empty array when no cache exists', async () => {
      const { readAllCacheApis } = await import('@/functions/wormaJson')
      const results = await readAllCacheApis('/project')
      expect(results).toEqual([])
    })

    it('should return empty array when cache has no entries', async () => {
      vol.mkdirSync('/project/.worma-cache', { recursive: true })
      vol.writeFileSync('/project/.worma-cache/index.json', JSON.stringify({ schemaVersion: 1, entries: [] }))
      const { readAllCacheApis } = await import('@/functions/wormaJson')
      const results = await readAllCacheApis('/project')
      expect(results).toEqual([])
    })

    it('should skip corrupted data files', async () => {
      const { writeCacheEntry, readAllCacheApis } = await import('@/functions/wormaJson')
      await writeCacheEntry('/project', 'src/api/good', 'Good Server', [
        { tag: 'user', method: 'GET', summary: 'OK', path: '/', pathParameters: '', queryParameters: '', name: 'ok', response: 'Ok' },
      ], { hash: 'good', tags: {} })
      // Corrupt a data file manually
      vol.writeFileSync('/project/.worma-cache/data/src_api_bad.json', '{invalid json')
      // Patch index to include the bad entry
      const idx = JSON.parse(vol.readFileSync('/project/.worma-cache/index.json', 'utf-8') as string)
      idx.entries.push({ path: 'src/api/bad', serverName: 'Bad', hash: 'bad', tags: {} })
      vol.writeFileSync('/project/.worma-cache/index.json', JSON.stringify(idx))

      const results = await readAllCacheApis('/project')
      // Should only contain the good entry; bad one skipped
      expect(results).toHaveLength(1)
      expect(results[0].path).toBe('src/api/good')
    })
  })

  describe('getApiDocs', () => {
    it('should return all entries when called without outputs filter', async () => {
      const { writeCacheEntry } = await import('@/functions/wormaJson')
      await writeCacheEntry('/project', 'src/api/one', 'Server One', [
        { tag: 'a', method: 'GET', summary: 'A1', path: '/a1', pathParameters: '', queryParameters: '', name: 'a1', response: 'A' },
      ], { hash: '1', tags: { a: 'h1' } })
      await writeCacheEntry('/project', 'src/api/two', 'Server Two', [
        { tag: 'b', method: 'POST', summary: 'B1', path: '/b1', pathParameters: '', queryParameters: '', name: 'b1', response: 'B' },
      ], { hash: '2', tags: { b: 'h2' } })

      const { getApiDocs } = await import('@/readConfig')
      const results = await getApiDocs(undefined, '/project')
      expect(results).toHaveLength(2)
      expect(results.map(r => r.path).sort()).toEqual(['src/api/one', 'src/api/two'])
    })

    it('should return only matching entries when called with outputs filter', async () => {
      const { writeCacheEntry } = await import('@/functions/wormaJson')
      await writeCacheEntry('/project', 'src/api/one', 'Server One', [
        { tag: 'a', method: 'GET', summary: 'A1', path: '/a1', pathParameters: '', queryParameters: '', name: 'a1', response: 'A' },
      ], { hash: '1', tags: { a: 'h1' } })
      await writeCacheEntry('/project', 'src/api/two', 'Server Two', [
        { tag: 'b', method: 'POST', summary: 'B1', path: '/b1', pathParameters: '', queryParameters: '', name: 'b1', response: 'B' },
      ], { hash: '2', tags: { b: 'h2' } })

      const { getApiDocs } = await import('@/readConfig')
      const results = await getApiDocs(['src/api/one'], '/project')
      expect(results).toHaveLength(1)
      expect(results[0].path).toBe('src/api/one')
      expect(results[0].serverName).toBe('Server One')
    })

    it('should return empty array when no cache exists', async () => {
      const { getApiDocs } = await import('@/readConfig')
      const results = await getApiDocs()
      expect(results).toEqual([])
    })

    it('should filter out non-matching outputs', async () => {
      const { writeCacheEntry } = await import('@/functions/wormaJson')
      await writeCacheEntry('/project', 'src/api/one', 'Server One', [], { hash: '1', tags: {} })

      const { getApiDocs } = await import('@/readConfig')
      // Request a path that doesn't exist in cache
      const results = await getApiDocs(['non/existent'], '/project')
      expect(results).toEqual([])
    })

    describe('monorepo cache unification', () => {
      it('should read entries from unified cacheRoot via sub-package path', async () => {
        const { setGlobalConfig } = await import('@/config')
        const { writeCacheEntry } = await import('@/functions/wormaJson')

        // Simulate monorepo: cacheRoot = /monorepo, sub-package at /monorepo/packages/app
        const monorepoCacheRoot = '/monorepo'
        setGlobalConfig({ cacheRoot: monorepoCacheRoot })

        // Write entries to the unified cache (as they would appear in monorepo)
        await writeCacheEntry('/monorepo', 'packages/app/src/api/users', 'App Users', [
          { tag: 'user', method: 'GET', summary: 'Get user', path: '/user', pathParameters: '', queryParameters: '', name: 'getUser', response: 'User' },
        ], { hash: 'app1', tags: { user: 'h1' } })
        await writeCacheEntry('/monorepo', 'packages/other/src/api/posts', 'Other Posts', [
          { tag: 'post', method: 'GET', summary: 'List posts', path: '/posts', pathParameters: '', queryParameters: '', name: 'listPosts', response: 'Post' },
        ], { hash: 'other1', tags: { post: 'h2' } })

        const { getApiDocs } = await import('@/readConfig')
        // Call from sub-package path — should still read from unified cacheRoot
        const results = await getApiDocs(undefined, '/monorepo/packages/app')

        expect(results).toHaveLength(2)
        expect(results.map(r => r.path).sort()).toEqual([
          'packages/app/src/api/users',
          'packages/other/src/api/posts',
        ])
      })

      it('should filter by sub-package output when using outputs filter in monorepo', async () => {
        const { setGlobalConfig } = await import('@/config')
        const { writeCacheEntry } = await import('@/functions/wormaJson')

        setGlobalConfig({ cacheRoot: '/monorepo' })

        await writeCacheEntry('/monorepo', 'packages/app/src/api/users', 'App Users', [], { hash: 'a', tags: {} })
        await writeCacheEntry('/monorepo', 'packages/other/src/api/posts', 'Other Posts', [], { hash: 'b', tags: {} })

        const { getApiDocs } = await import('@/readConfig')
        // Call from sub-package with its local output path — toCacheRelativePath translates it
        const results = await getApiDocs(['src/api/users'], '/monorepo/packages/app')

        expect(results).toHaveLength(1)
        expect(results[0].path).toBe('packages/app/src/api/users')
        expect(results[0].serverName).toBe('App Users')
      })
    })
  })
})
