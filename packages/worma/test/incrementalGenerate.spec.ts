import type { ApiPlugin } from '@/type'
import fs from 'node:fs/promises'
import path, { resolve } from 'node:path'
import { vol } from 'memfs'
import { setGlobalConfig } from '@/config'
import { getChange, listChanges } from '@/functions/changeReport'
import { getCacheEntry, readCacheApis } from '@/functions/wormaJson'
import { generate } from '@/index'

vi.mock('node:fs')
vi.mock('node:fs/promises')

const PROJECT = '/project'
const OUTPUT = 'src/api'
const OUTPUT_DIR = path.join(PROJECT, OUTPUT)
const FIXTURES = resolve(__dirname, './incremental/__fixtures__/presets')

function makeSpec(extraPaths: Record<string, any> = {}, version = '1.0.0') {
  return JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'Demo', version },
    paths: {
      '/pets': { get: { tags: ['pets'], summary: 'list pets', responses: { 200: { description: 'ok' } } } },
      '/users': { get: { tags: ['users'], summary: 'list users', responses: { 200: { description: 'ok' } } } },
      ...extraPaths,
    },
  })
}

function read(p: string) {
  return fs.readFile(p, 'utf-8') as Promise<string>
}
async function exists(p: string) {
  try {
    await fs.access(p)
    return true
  }
  catch {
    return false
  }
}

async function runWith(tpl: 'flat' | 'tagdir') {
  return generate({
    generator: [{
      input: 'spec.json',
      output: OUTPUT,
      type: 'ts' as const,
      plugins: [{ name: 'test-template', getTemplate: () => ({ path: `${FIXTURES}/${tpl}` }) } as ApiPlugin],
    }],
  }, { projectPath: PROJECT })
}

function run() {
  return runWith('flat')
}

describe('incremental generation', () => {
  beforeEach(() => {
    vol.reset()
    setGlobalConfig({ cacheRoot: undefined, changeHistoryLimit: 100 })
    vol.mkdirSync(PROJECT, { recursive: true })
    vol.mkdirSync(OUTPUT_DIR, { recursive: true })
    vol.writeFileSync(`${PROJECT}/spec.json`, makeSpec())
  })

  it('`generate()` no longer no-ops: global files are re-rendered even when nothing changed', async () => {
    await run()
    await fs.writeFile(path.join(OUTPUT_DIR, 'index.ts'), 'MODIFIED')

    await run()

    // Previously the whole run was skipped (`success: false`) and the hand edit
    // survived. Now `generate()` always reaches the render phase, so global
    // templates are rewritten. Per-tag incremental rendering is unaffected.
    expect(await read(path.join(OUTPUT_DIR, 'index.ts'))).not.toBe('MODIFIED')
    expect(await read(path.join(OUTPUT_DIR, 'index.ts'))).toContain('Demo')
  })

  it('re-renders only the tags whose hash changed', async () => {
    await run()
    await fs.writeFile(path.join(OUTPUT_DIR, 'pets.ts'), 'PETS-MODIFIED')
    await fs.writeFile(path.join(OUTPUT_DIR, 'users.ts'), 'USERS-MODIFIED')

    // touch only the `users` tag
    vol.writeFileSync(`${PROJECT}/spec.json`, makeSpec({
      '/users/{id}': { get: { tags: ['users'], summary: 'get user', responses: { 200: { description: 'ok' } } } },
    }))
    await run()

    expect(await read(path.join(OUTPUT_DIR, 'pets.ts'))).toBe('PETS-MODIFIED')
    expect(await read(path.join(OUTPUT_DIR, 'users.ts'))).not.toBe('USERS-MODIFIED')
    expect(await read(path.join(OUTPUT_DIR, 'users.ts'))).toContain('get_users_id')
  })

  it('renders every tag when there is no generation baseline', async () => {
    // A detection-only baseline (no `tags`) must NOT count as "already rendered".
    const { updateSourceBaseline } = await import('@/functions/wormaJson')
    await updateSourceBaseline(PROJECT, OUTPUT, { resolvedInput: 'spec.json', rawHash: 'x', updatedAt: 1 })

    await run()

    expect(await exists(path.join(OUTPUT_DIR, 'pets.ts'))).toBe(true)
    expect(await exists(path.join(OUTPUT_DIR, 'users.ts'))).toBe(true)
  })

  it('removes artifacts of tags that disappeared from the spec', async () => {
    await run()
    expect(await exists(path.join(OUTPUT_DIR, 'users.ts'))).toBe(true)

    vol.writeFileSync(`${PROJECT}/spec.json`, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Demo', version: '1.0.0' },
      paths: {
        '/pets': { get: { tags: ['pets'], summary: 'list pets', responses: { 200: { description: 'ok' } } } },
      },
    }))
    await run()

    expect(await exists(path.join(OUTPUT_DIR, 'users.ts'))).toBe(false)
    expect(await exists(path.join(OUTPUT_DIR, 'pets.ts'))).toBe(true)
  })

  it('removes the whole `[tag]` directory produced by tag-dir templates', async () => {
    await runWith('tagdir')
    expect(await exists(path.join(OUTPUT_DIR, 'users', 'index.ts'))).toBe(true)

    vol.writeFileSync(`${PROJECT}/spec.json`, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Demo', version: '1.0.0' },
      paths: {
        '/pets': { get: { tags: ['pets'], summary: 'list pets', responses: { 200: { description: 'ok' } } } },
      },
    }))
    await runWith('tagdir')

    expect(await exists(path.join(OUTPUT_DIR, 'users', 'index.ts'))).toBe(false)
    expect(await exists(path.join(OUTPUT_DIR, 'pets', 'index.ts'))).toBe(true)
  })

  it('stores cache data split per tag under data/<slug>/<tag>.json', async () => {
    await run()

    expect(await exists(`${PROJECT}/.worma-cache/data/src_api/pets.json`)).toBe(true)
    expect(await exists(`${PROJECT}/.worma-cache/data/src_api/users.json`)).toBe(true)

    const cached = await readCacheApis(PROJECT, OUTPUT)
    expect(cached).not.toBeNull()
    expect(cached!.apis.map(a => a.tag).sort()).toEqual(['pets', 'users'])
    expect(cached!.serverName).toBe('Demo')
  })

  it('drops the data file of a tag that disappeared', async () => {
    await run()
    vol.writeFileSync(`${PROJECT}/spec.json`, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Demo', version: '1.0.0' },
      paths: {
        '/pets': { get: { tags: ['pets'], summary: 'list pets', responses: { 200: { description: 'ok' } } } },
      },
    }))
    await run()

    expect(await exists(`${PROJECT}/.worma-cache/data/src_api/users.json`)).toBe(false)
    const cached = await readCacheApis(PROJECT, OUTPUT)
    expect(cached!.apis.map(a => a.tag)).toEqual(['pets'])
  })

  it('writes a source change record when (and only when) the spec changed', async () => {
    // First run only establishes the snapshot baseline → nothing recorded.
    await run()
    expect(await listChanges(PROJECT)).toHaveLength(0)

    // nothing changed → still no record
    await run()
    expect(await listChanges(PROJECT)).toHaveLength(0)

    vol.writeFileSync(`${PROJECT}/spec.json`, makeSpec({
      '/admins': { get: { tags: ['admins'], summary: 'list admins', responses: { 200: { description: 'ok' } } } },
    }))
    await run()

    const list = await listChanges(PROJECT)
    expect(list).toHaveLength(1)
    expect(list[0].summary).toEqual({ generators: 1, added: 1, removed: 0, modified: 0 })

    const change = await getChange(PROJECT, 'latest')
    expect(change!.schemaVersion).toBe(1)
    expect(change!.generators[0].changes).toContainEqual(
      expect.objectContaining({ op: '+', kind: 'api', target: 'GET /admins', level: 'additive' }),
    )
  })

  it('records removed and added operations in the change record', async () => {
    await run()
    vol.writeFileSync(`${PROJECT}/spec.json`, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Demo', version: '1.0.0' },
      paths: {
        '/pets': {
          post: { tags: ['pets'], summary: 'create pet', requestBody: { content: { 'application/json': { schema: { type: 'object' } } } }, responses: { 200: { description: 'ok' } } },
        },
      },
    }))
    await run()

    const change = await getChange(PROJECT, 'latest')
    const targets = change!.generators[0].changes.map(row => `${row.op} ${row.target}`)
    // `get /pets` was replaced by `post /pets`, and `/users` disappeared
    expect(targets).toContain('- GET /pets')
    expect(targets).toContain('- GET /users')
    expect(targets).toContain('+ POST /pets')
  })

  it('refreshes the source baseline after a successful generation', async () => {
    await run()

    const entry = await getCacheEntry(PROJECT, OUTPUT)
    expect(entry?.source?.resolvedInput).toBe('spec.json')
    expect(typeof entry?.source?.rawHash).toBe('string')
    expect(typeof entry?.source?.updatedAt).toBe('number')
  })

  it('refreshes the source baseline to the newly generated spec', async () => {
    await run()
    const first = await getCacheEntry(PROJECT, OUTPUT)

    const v2 = makeSpec({}, '2.0.0')
    vol.writeFileSync(`${PROJECT}/spec.json`, v2)
    await run()

    const { computeSpecHash } = await import('@/functions/wormaJson')
    const second = await getCacheEntry(PROJECT, OUTPUT)
    expect(second?.source?.rawHash).toBe(computeSpecHash(v2))
    expect(second?.source?.rawHash).not.toBe(first?.source?.rawHash)
    // the render baseline is refreshed independently
    expect(second?.tags).toBeDefined()
    expect(Object.keys(second!.tags).length).toBeGreaterThan(0)
  })
})
