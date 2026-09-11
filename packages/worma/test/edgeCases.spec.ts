import type { Api, ApiPlugin } from '@/type'
import fs from 'node:fs/promises'
import path, { resolve } from 'node:path'

import { vol } from 'memfs'
import { http, HttpResponse } from 'msw'
import { checkUpdates } from '@/checkUpdates'
import { setGlobalConfig } from '@/config'
import { captureChange, getChange, LATEST_CHANGE_ID, listChanges } from '@/functions/changeReport'
import { diffApis, hasApiChanges } from '@/functions/diffApis'
import { computeSpecHash, updateSourceBaseline } from '@/functions/wormaJson'
import { generate } from '@/index'
import { server } from './mswServer'

vi.mock('node:fs')
vi.mock('node:fs/promises')

const SPEC = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Demo', version: '1.0.0' },
  paths: { '/pets': { get: { tags: ['pets'], summary: 'list pets', responses: { 200: { description: 'ok' } } } } },
})

/** Same document plus one operation — used to trigger a real source change. */
const SPEC_WITH_ADMINS = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Demo', version: '1.0.0' },
  paths: {
    '/pets': { get: { tags: ['pets'], summary: 'list pets', responses: { 200: { description: 'ok' } } } },
    '/admins': { get: { tags: ['admins'], summary: 'list admins', responses: { 200: { description: 'ok' } } } },
  },
})

const FIXTURES = resolve(__dirname, './incremental/__fixtures__/presets')

function api(partial: Partial<Api> & { method: string, path: string }): Api {
  return { tag: 'default', summary: '', pathParameters: '', queryParameters: '', name: 'op', response: 'any', ...partial } as Api
}

describe('edge cases', () => {
  describe('diffApis()', () => {
    it('reports a tag change (same method+path) as modified, including `tag` in changedFields', () => {
      const result = diffApis(
        [api({ method: 'GET', path: '/a', tag: 'old', name: 'getA' })],
        [api({ method: 'GET', path: '/a', tag: 'new', name: 'getA' })],
      )
      expect(result.added).toEqual([])
      expect(result.removed).toEqual([])
      expect(result.modified).toHaveLength(1)
      expect(result.modified[0].changedFields).toContain('tag')
    })

    it('collects every changed field (incl. tag) on a single modified API', () => {
      const result = diffApis(
        [api({ method: 'GET', path: '/a', tag: 'old', response: 'A', queryParameters: 'Q1' })],
        [api({ method: 'GET', path: '/a', tag: 'new', response: 'A2', queryParameters: 'Q1' })],
      )
      expect(result.modified[0].changedFields.sort()).toEqual(['response', 'tag'])
    })

    it('treats an empty previous list as an all-added diff (no baseline)', () => {
      const result = diffApis([], [api({ method: 'GET', path: '/a' })])
      expect(result.added).toHaveLength(1)
      expect(hasApiChanges(result)).toBe(true)
    })
  })

  describe('checkUpdates()', () => {
    beforeEach(() => {
      vol.reset()
      vol.mkdirSync('/project', { recursive: true })
      setGlobalConfig({ cacheRoot: undefined })
    })

    it('reports `error` for every input when an array of sources all fail', async () => {
      server.use(
        http.get('https://example.com/one.json', () => new HttpResponse(null, { status: 500 })),
        http.get('https://example.com/two.json', () => new HttpResponse(null, { status: 404 })),
      )

      const result = await checkUpdates({
        generator: [{ input: ['https://example.com/one.json', 'https://example.com/two.json'], output: 'src/api' }],
      }, { projectPath: '/project' })

      expect(result.hasChanges).toBe(false)
      expect(result.updates).toHaveLength(1)
      expect(result.updates[0].status).toBe('error')
      expect(typeof result.updates[0].error).toBe('string')
    })

    it('does not compare the generation-side `hash` when deciding status', async () => {
      vol.writeFileSync('/project/o.json', SPEC)
      await updateSourceBaseline('/project', 'src/api', { rawHash: computeSpecHash(SPEC), updatedAt: 1 })

      const result = await checkUpdates({ generator: [{ input: 'o.json', output: 'src/api' }] }, { projectPath: '/project' })
      expect(result.updates[0].status).toBe('unchanged')
    })
  })

  describe('change records (requirement B)', () => {
    beforeEach(() => {
      vol.reset()
      vol.mkdirSync('/project', { recursive: true })
      setGlobalConfig({ cacheRoot: undefined, changeHistoryLimit: 100 })
    })

    it('prunes to exactly the newest record when changeHistoryLimit is 1', async () => {
      setGlobalConfig({ changeHistoryLimit: 1 })
      for (let i = 1; i <= 4; i++) {
        await captureChange('/project', { createdAt: i, projectPath: '/project', generators: [{
          output: 'src/api',
          serverName: 'Demo',
          changes: [{ op: '+', kind: 'api', target: `GET /a${i}`, level: 'additive' }],
        }] })
      }
      const files = await fs.readdir('/project/.worma-cache/changes')
      expect(files).toEqual(['0004.json'])
      const latest = await getChange('/project', LATEST_CHANGE_ID)
      expect(latest?.generators[0].changes[0].target).toBe('GET /a4')
    })

    it('writes a record even when the diff is entirely empty (summary all zeros)', async () => {
      await captureChange('/project', {
        createdAt: 1,
        projectPath: '/project',
        generators: [{ output: 'src/api', serverName: 'Demo', changes: [] }],
      })
      const list = await listChanges('/project')
      expect(list).toHaveLength(1)
      expect(list[0].summary).toEqual({ generators: 1, added: 0, removed: 0, modified: 0 })
    })

    it('aggregates multiple generators into a single change record', async () => {
      await captureChange('/project', {
        createdAt: 1,
        projectPath: '/project',
        generators: [
          { output: 'src/a', serverName: 'A', changes: [{ op: '+', kind: 'api', target: 'GET /a', level: 'additive' }] },
          { output: 'src/b', serverName: 'B', changes: [{ op: '-', kind: 'api', target: 'GET /b', level: 'breaking' }] },
        ],
      })
      const list = await listChanges('/project')
      expect(list[0].summary).toEqual({ generators: 2, added: 1, removed: 1, modified: 0 })
      expect(list[0].outputs).toEqual(['src/a', 'src/b'])
    })

    it('reads legacy (api-level) records through the same row model', async () => {
      vol.mkdirSync('/project/.worma-cache/changes', { recursive: true })
      vol.writeFileSync('/project/.worma-cache/changes/0001.json', JSON.stringify({
        id: '0001',
        createdAt: 1,
        projectPath: '/project',
        generators: [{
          output: 'src/api',
          serverName: 'Demo',
          added: [{ method: 'GET', path: '/new', name: 'getNew' }],
          removed: [{ method: 'GET', path: '/old' }],
          modified: [{ method: 'POST', path: '/pet', changedFields: ['queryParameters'] }],
        }],
      }))

      const list = await listChanges('/project')
      expect(list[0].summary).toEqual({ generators: 1, added: 1, removed: 1, modified: 1 })

      const change = await getChange('/project', '0001')
      expect(change!.generators[0].changes).toEqual([
        { op: '+', kind: 'api', target: 'GET /new', detail: 'getNew', level: 'additive' },
        { op: '-', kind: 'api', target: 'GET /old', level: 'breaking' },
        { op: '~', kind: 'api', target: 'POST /pet', detail: 'queryParameters', level: 'breaking' },
      ])
    })
  })

  describe('generate() lifecycle', () => {
    const PROJECT = '/project'
    const OUTPUT = 'src/api'
    const OUTPUT_DIR = path.join(PROJECT, OUTPUT)

    function makeConfig(overrides: Partial<ApiPlugin> = {}) {
      return {
        generator: [{
          input: 'spec.json',
          output: OUTPUT,
          type: 'ts' as const,
          plugins: [{ name: 'test-template', getTemplate: () => ({ path: `${FIXTURES}/flat` }), ...overrides } as ApiPlugin],
        }],
      }
    }

    beforeEach(() => {
      vol.reset()
      setGlobalConfig({ cacheRoot: undefined, changeHistoryLimit: 100 })
      vol.mkdirSync(PROJECT, { recursive: true })
      vol.mkdirSync(OUTPUT_DIR, { recursive: true })
      vol.writeFileSync(`${PROJECT}/spec.json`, SPEC)
    })

    it('emits `active` and a terminal phase for each generator via onProgress', async () => {
      const phases: string[] = []
      await generate(makeConfig(), {
        projectPath: PROJECT,
        onProgress: (e) => { phases.push(e.phase) },
      })
      expect(phases).toContain('active')
      expect(phases.some(p => p === 'done' || p === 'skipped')).toBe(true)
    })

    it('aggregates source changes across multiple generators into one record', async () => {
      const twoGen = {
        generator: [
          { input: 'spec.json', output: 'src/a', type: 'ts' as const, plugins: [{ name: 't1', getTemplate: () => ({ path: `${FIXTURES}/flat` }) } as ApiPlugin] },
          { input: 'spec.json', output: 'src/b', type: 'ts' as const, plugins: [{ name: 't2', getTemplate: () => ({ path: `${FIXTURES}/flat` }) } as ApiPlugin] },
        ],
      }
      // First run only establishes each generator's snapshot baseline.
      await generate(twoGen, { projectPath: PROJECT })
      expect(await listChanges(PROJECT)).toHaveLength(0)

      vol.writeFileSync(`${PROJECT}/spec.json`, SPEC_WITH_ADMINS)
      await generate(twoGen, { projectPath: PROJECT })

      const list = await listChanges(PROJECT)
      expect(list).toHaveLength(1)
      expect(list[0].summary.generators).toBe(2)
      // one added operation per generator
      expect(list[0].summary.added).toBe(2)
    })

    it('does not write a change record on a no-op re-run after a stable first run', async () => {
      // Baseline run: no record yet.
      await generate(makeConfig(), { projectPath: PROJECT })
      expect(await listChanges(PROJECT)).toHaveLength(0)

      vol.writeFileSync(`${PROJECT}/spec.json`, SPEC_WITH_ADMINS)
      await generate(makeConfig(), { projectPath: PROJECT })
      expect(await listChanges(PROJECT)).toHaveLength(1)

      // Second run with identical spec → nothing changed → no new record.
      await generate(makeConfig(), { projectPath: PROJECT })
      expect(await listChanges(PROJECT)).toHaveLength(1)
    })

    it('emits the recorded change id through onChangeRecorded', async () => {
      await generate(makeConfig(), { projectPath: PROJECT })

      const recorded: Array<{ id: string, added: number }> = []
      vol.writeFileSync(`${PROJECT}/spec.json`, SPEC_WITH_ADMINS)
      await generate(makeConfig(), {
        projectPath: PROJECT,
        onChangeRecorded: change => recorded.push(change),
      })

      expect(recorded).toEqual([{ id: '0001', added: 1, removed: 0, modified: 0 }])
    })

    it('does not emit a change id when the spec is unchanged', async () => {
      await generate(makeConfig(), { projectPath: PROJECT })

      const recorded: string[] = []
      await generate(makeConfig(), {
        projectPath: PROJECT,
        onChangeRecorded: change => recorded.push(change.id),
      })

      expect(recorded).toEqual([])
    })
  })
})
