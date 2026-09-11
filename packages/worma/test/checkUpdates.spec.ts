import type { Config } from '@/type/lib'
import fs from 'node:fs/promises'
import { resolve } from 'node:path'
import { vol } from 'memfs'
import { http, HttpResponse } from 'msw'
import { checkUpdates } from '@/checkUpdates'
import { setGlobalConfig } from '@/config'
import { computeSpecHash, readCacheIndex, updateSourceBaseline } from '@/functions/wormaJson'
import { server } from './mswServer'

vi.mock('node:fs')
vi.mock('node:fs/promises')

const SPEC_V1 = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'demo', version: '1.0.0' },
  paths: { '/users': { get: { responses: {} } } },
})
const SPEC_V2 = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'demo', version: '2.0.0' },
  paths: { '/users': { get: { responses: {} } }, '/admins': { get: { responses: {} } } },
})

const REMOTE_URL = 'https://example.com/openapi.json'

function configOf(...generators: Config['generator']): Config {
  return { generator: generators }
}

async function readIndex(projectPath: string) {
  return JSON.parse(await fs.readFile(`${projectPath}/.worma-cache/index.json`, 'utf-8'))
}

describe('checkUpdates()', () => {
  beforeEach(() => {
    vol.reset()
    vol.mkdirSync('/project', { recursive: true })
    setGlobalConfig({ cacheRoot: undefined })
  })

  it('reports `new` and writes the baseline on first run (no prompt-worthy change)', async () => {
    vol.writeFileSync('/project/openapi.json', SPEC_V1)

    const result = await checkUpdates(configOf({ input: 'openapi.json', output: 'src/api' }), {
      projectPath: '/project',
    })

    expect(result.hasChanges).toBe(false)
    expect(result.updates).toHaveLength(1)
    expect(result.updates[0].status).toBe('new')
    expect(result.updates[0].hash).toBe(computeSpecHash(SPEC_V1))
    expect(result.updates[0].resolvedInput).toBe('openapi.json')

    // baseline persisted into index.json entry's `source` sub-field
    const index = await readIndex('/project')
    expect(index.entries[0].source.rawHash).toBe(computeSpecHash(SPEC_V1))
    expect(index.entries[0].source.resolvedInput).toBe('openapi.json')
    expect(typeof index.entries[0].source.updatedAt).toBe('number')
  })

  it('reports `unchanged` when the spec hash matches the baseline', async () => {
    vol.writeFileSync('/project/openapi.json', SPEC_V1)
    await updateSourceBaseline('/project', 'src/api', {
      resolvedInput: 'openapi.json',
      rawHash: computeSpecHash(SPEC_V1),
      updatedAt: 1,
    })

    const result = await checkUpdates(configOf({ input: 'openapi.json', output: 'src/api' }), {
      projectPath: '/project',
    })

    expect(result.hasChanges).toBe(false)
    expect(result.updates[0].status).toBe('unchanged')
  })

  it('reports `changed` when the spec hash differs from the baseline', async () => {
    vol.writeFileSync('/project/openapi.json', SPEC_V2)
    await updateSourceBaseline('/project', 'src/api', {
      resolvedInput: 'openapi.json',
      rawHash: computeSpecHash(SPEC_V1),
      updatedAt: 1,
    })

    const result = await checkUpdates(configOf({ input: 'openapi.json', output: 'src/api' }), {
      projectPath: '/project',
    })

    expect(result.hasChanges).toBe(true)
    expect(result.updates[0].status).toBe('changed')
    expect(result.updates[0].hash).toBe(computeSpecHash(SPEC_V2))
  })

  it('reports `error` (and never throws) when the source cannot be fetched', async () => {
    const result = await checkUpdates(configOf({ input: 'does-not-exist.json', output: 'src/api' }), {
      projectPath: '/project',
    })

    expect(result.hasChanges).toBe(false)
    expect(result.updates[0].status).toBe('error')
    expect(typeof result.updates[0].error).toBe('string')
  })

  it('never touches the generation-side `hash` / `tags` fields', async () => {
    vol.writeFileSync('/project/openapi.json', SPEC_V2)
    await updateSourceBaseline('/project', 'src/api', {
      resolvedInput: 'openapi.json',
      rawHash: computeSpecHash(SPEC_V1),
      updatedAt: 1,
    }, 'Demo Server')
    // simulate an existing generation baseline
    const index = await readIndex('/project')
    index.entries[0].hash = 'generation-hash'
    index.entries[0].tags = { user: 'tag-hash' }
    vol.writeFileSync('/project/.worma-cache/index.json', JSON.stringify(index))

    await checkUpdates(configOf({ input: 'openapi.json', output: 'src/api' }), {
      projectPath: '/project',
    })

    const after = await readIndex('/project')
    expect(after.entries[0].hash).toBe('generation-hash')
    expect(after.entries[0].tags).toEqual({ user: 'tag-hash' })
    expect(after.entries[0].serverName).toBe('Demo Server')
  })

  it('does not create a standalone sources.json file', async () => {
    vol.writeFileSync('/project/openapi.json', SPEC_V1)
    await checkUpdates(configOf({ input: 'openapi.json', output: 'src/api' }), {
      projectPath: '/project',
    })

    const files = await fs.readdir('/project/.worma-cache')
    expect(files).not.toContain('sources.json')
    expect(files).toContain('index.json')
  })

  it('resolves remote urls and reports changes', async () => {
    server.use(http.get(REMOTE_URL, () => HttpResponse.text(SPEC_V1)))
    await updateSourceBaseline('/project', 'src/api', {
      resolvedInput: REMOTE_URL,
      rawHash: computeSpecHash(SPEC_V2),
      updatedAt: 1,
    })

    const result = await checkUpdates(configOf({ input: REMOTE_URL, output: 'src/api' }), {
      projectPath: '/project',
    })

    expect(result.updates[0].status).toBe('changed')
    expect(result.updates[0].resolvedInput).toBe(REMOTE_URL)
  })

  it('races an array of inputs and uses the first that succeeds', async () => {
    server.use(
      http.get('https://example.com/broken.json', () => new HttpResponse(null, { status: 500 })),
      http.get(REMOTE_URL, () => HttpResponse.text(SPEC_V1)),
    )
    await updateSourceBaseline('/project', 'src/api', {
      resolvedInput: REMOTE_URL,
      rawHash: computeSpecHash(SPEC_V2),
      updatedAt: 1,
    })

    const result = await checkUpdates(configOf({
      input: ['https://example.com/broken.json', REMOTE_URL],
      output: 'src/api',
    }), { projectPath: '/project' })

    expect(result.updates[0].status).toBe('changed')
    expect(result.updates[0].resolvedInput).toBe(REMOTE_URL)
  })

  it('reports one entry per generator, preserving the config index', async () => {
    vol.writeFileSync('/project/a.json', SPEC_V1)
    vol.writeFileSync('/project/b.json', SPEC_V2)
    await updateSourceBaseline('/project', 'src/a', { rawHash: computeSpecHash(SPEC_V1), updatedAt: 1 })
    await updateSourceBaseline('/project', 'src/b', { rawHash: computeSpecHash(SPEC_V1), updatedAt: 1 })

    const result = await checkUpdates(configOf(
      { input: 'a.json', output: 'src/a', serverName: 'A' },
      { input: 'b.json', output: 'src/b', serverName: 'B' },
    ), { projectPath: '/project' })

    expect(result.updates.map(u => u.index)).toEqual([0, 1])
    expect(result.updates.map(u => u.status)).toEqual(['unchanged', 'changed'])
    expect(result.updates[1].serverName).toBe('B')
    expect(result.hasChanges).toBe(true)
  })

  it('populates `input` via a plugin `config` hook (e.g. swagger platform plugin)', async () => {
    vol.writeFileSync('/project/openapi.json', SPEC_V1)
    // Mimics how platform plugins (swagger/knife4j/yapi) inject the
    // OpenAPI source: the source is NOT in `config.input` directly, but is
    // written there by the plugin's `config` hook.
    const platformPlugin = {
      name: 'fake-swagger',
      config: ({ config }: { config: any }) => {
        config.input = 'openapi.json'
        return config
      },
    }

    const result = await checkUpdates(configOf({ output: 'src/api', plugins: [platformPlugin] }), {
      projectPath: '/project',
    })

    // Must NOT error with "Cannot find module '/project'" — the input must be
    // resolved from the plugin hook, not left empty.
    expect(result.updates[0].status).toBe('new')
    expect(result.updates[0].resolvedInput).toBe('openapi.json')
    expect(result.updates[0].hash).toBe(computeSpecHash(SPEC_V1))
  })

  it('does not execute any plugin hook', async () => {
    vol.writeFileSync('/project/openapi.json', SPEC_V1)
    const calls: string[] = []
    const plugin = {
      name: 'spy',
      beforeSpecParse: () => { calls.push('beforeSpecParse') },
      specParsed: () => { calls.push('specParsed') },
      beforeCodeGenerate: () => { calls.push('beforeCodeGenerate') },
      codeGenerated: () => { calls.push('codeGenerated') },
    }

    await checkUpdates(configOf({ input: 'openapi.json', output: 'src/api', plugins: [plugin] }), {
      projectPath: '/project',
    })

    expect(calls).toEqual([])
  })

  it('uses the project cache root instead of cwd', async () => {
    vol.mkdirSync('/other', { recursive: true })
    vol.writeFileSync('/project/openapi.json', SPEC_V1)

    await checkUpdates(configOf({ input: 'openapi.json', output: 'src/api' }), {
      projectPath: '/project',
    })

    expect(await readCacheIndex('/project')).not.toBeNull()
    expect(vol.existsSync('/other/.worma-cache')).toBe(false)
    expect(resolve('/project/.worma-cache')).toContain('.worma-cache')
  })

  it('persists every `new` baseline when generators run concurrently', async () => {
    // Regression: the per-generator baselines used to be written from inside the
    // `Promise.all` (read → modify → write-whole-file), so only the last writer
    // survived and the other sources stayed `new` forever.
    vol.writeFileSync('/project/a.json', SPEC_V1)
    vol.writeFileSync('/project/b.json', SPEC_V1)
    vol.writeFileSync('/project/c.json', SPEC_V1)

    const result = await checkUpdates(configOf(
      { input: 'a.json', output: 'src/a' },
      { input: 'b.json', output: 'src/b' },
      { input: 'c.json', output: 'src/c' },
    ), { projectPath: '/project' })

    expect(result.updates.map(u => u.status)).toEqual(['new', 'new', 'new'])

    const index = await readIndex('/project')
    const withSource = index.entries.filter((e: any) => e.source?.rawHash)
    expect(withSource.map((e: any) => e.path).sort()).toEqual(['src/a', 'src/b', 'src/c'])
  })

  it('reports whether the project already has a generation baseline', async () => {
    vol.writeFileSync('/project/openapi.json', SPEC_V1)

    const fresh = await checkUpdates(configOf({ input: 'openapi.json', output: 'src/api' }), {
      projectPath: '/project',
    })
    expect(fresh.hasGenerationBaseline).toBe(false)

    // Simulate a completed generation on the very same project.
    const index = await readIndex('/project')
    index.entries[0].hash = 'generation-hash'
    index.entries[0].tags = { user: 'tag-hash' }
    vol.writeFileSync('/project/.worma-cache/index.json', JSON.stringify(index))

    const established = await checkUpdates(configOf({ input: 'openapi.json', output: 'src/api' }), {
      projectPath: '/project',
    })
    expect(established.hasGenerationBaseline).toBe(true)
    expect(established.updates[0].status).toBe('unchanged')
  })
})
