import type { ChangeItem } from '@/functions/changeReport'
import fs from 'node:fs/promises'
import { vol } from 'memfs'
import { setGlobalConfig } from '@/config'
import { captureChange, getChange, LATEST_CHANGE_ID, listChanges } from '@/functions/changeReport'

vi.mock('node:fs')
vi.mock('node:fs/promises')

function item(partial: Partial<ChangeItem> = {}): ChangeItem {
  return {
    output: 'src/api',
    serverName: 'Demo',
    changes: [{ op: '+', kind: 'api', target: 'GET /a', level: 'additive' }],
    ...partial,
  }
}

async function fileNames(dir: string): Promise<string[]> {
  try {
    return (await fs.readdir(dir)) as string[]
  }
  catch {
    return []
  }
}

describe('change records (requirement B)', () => {
  beforeEach(() => {
    vol.reset()
    vol.mkdirSync('/project', { recursive: true })
    setGlobalConfig({ cacheRoot: undefined, changeHistoryLimit: 100 })
  })

  it('writes changes/<NNNN>.json with a zero-padded sequence id', async () => {
    const id1 = await captureChange('/project', { createdAt: 1, projectPath: '/project', generators: [item()] })
    const id2 = await captureChange('/project', { createdAt: 2, projectPath: '/project', generators: [item()] })

    expect(id1).toBe('0001')
    expect(id2).toBe('0002')
    expect(await fileNames('/project/.worma-cache/changes')).toEqual(['0001.json', '0002.json'])
  })

  it('lists records newest first with aggregated counts', async () => {
    await captureChange('/project', {
      createdAt: 10,
      projectPath: '/project',
      generators: [item({ changes: [{ op: '+', kind: 'api', target: 'GET /a', level: 'additive' }] })],
    })
    await captureChange('/project', {
      createdAt: 20,
      projectPath: '/project',
      generators: [
        item({
          output: 'src/a',
          changes: [
            { op: '+', kind: 'api', target: 'GET /a', level: 'additive' },
            { op: '+', kind: 'api', target: 'POST /b', level: 'additive' },
          ],
        }),
        item({
          output: 'src/b',
          changes: [
            { op: '-', kind: 'api', target: 'GET /c', level: 'breaking' },
            { op: '~', kind: 'param', target: 'GET /c', item: 'query.limit.required', level: 'breaking' },
          ],
        }),
      ],
    })

    const list = await listChanges('/project')
    expect(list.map(s => s.id)).toEqual(['0002', '0001'])
    expect(list[0].summary).toEqual({ generators: 2, added: 2, removed: 1, modified: 1 })
    expect(list[0].outputs).toEqual(['src/a', 'src/b'])
    expect(list[0].createdAt).toBe(20)
  })

  it('reads a record by id and via the `latest` alias', async () => {
    await captureChange('/project', { createdAt: 1, projectPath: '/project', generators: [item({ output: 'src/one' })] })
    await captureChange('/project', { createdAt: 2, projectPath: '/project', generators: [item({ output: 'src/two' })] })

    const first = await getChange('/project', '0001')
    expect(first?.generators[0].output).toBe('src/one')

    const latest = await getChange('/project', LATEST_CHANGE_ID)
    expect(latest?.id).toBe('0002')
    expect(latest?.generators[0].output).toBe('src/two')
  })

  it('returns undefined for an unknown id and when there is no record at all', async () => {
    expect(await getChange('/project', 'latest')).toBeUndefined()
    expect(await getChange('/project', '0099')).toBeUndefined()
  })

  it('returns an empty list when the changes directory does not exist', async () => {
    expect(await listChanges('/project')).toEqual([])
  })

  it('prunes records outside changeHistoryLimit', async () => {
    setGlobalConfig({ changeHistoryLimit: 3 })
    for (let i = 1; i <= 5; i++) {
      await captureChange('/project', { createdAt: i, projectPath: '/project', generators: [item()] })
    }
    expect(await fileNames('/project/.worma-cache/changes')).toEqual(['0003.json', '0004.json', '0005.json'])
  })

  it('keeps every record when changeHistoryLimit is 0', async () => {
    setGlobalConfig({ changeHistoryLimit: 0 })
    for (let i = 1; i <= 4; i++) {
      await captureChange('/project', { createdAt: i, projectPath: '/project', generators: [item()] })
    }
    expect(await fileNames('/project/.worma-cache/changes')).toHaveLength(4)
  })

  it('never reuses an id when index.json#changeSeq was lost', async () => {
    await captureChange('/project', { createdAt: 1, projectPath: '/project', generators: [item()] })
    await captureChange('/project', { createdAt: 2, projectPath: '/project', generators: [item()] })

    // Simulate a rewritten index.json that no longer carries the counter.
    vol.writeFileSync('/project/.worma-cache/index.json', JSON.stringify({
      schemaVersion: 1,
      entries: [{ path: 'src/api', serverName: 'Demo', hash: 'h', tags: { user: 't' } }],
    }))

    const id = await captureChange('/project', { createdAt: 3, projectPath: '/project', generators: [item()] })

    expect(id).toBe('0003')
    expect(await fileNames('/project/.worma-cache/changes')).toEqual(['0001.json', '0002.json', '0003.json'])
  })

  it('lists by createdAt and resolves `latest` to the newest record', async () => {
    vol.mkdirSync('/project/.worma-cache/changes', { recursive: true })
    // Ids out of chronological order (0001 written after 0002 by a reset counter).
    vol.writeFileSync('/project/.worma-cache/changes/0002.json', JSON.stringify({
      id: '0002',
      createdAt: 100,
      projectPath: '/project',
      generators: [item({ output: 'src/old' })],
    }))
    vol.writeFileSync('/project/.worma-cache/changes/0001.json', JSON.stringify({
      id: '0001',
      createdAt: 200,
      projectPath: '/project',
      generators: [item({ output: 'src/new' })],
    }))

    const list = await listChanges('/project')
    expect(list.map(s => s.id)).toEqual(['0001', '0002'])

    const latest = await getChange('/project', LATEST_CHANGE_ID)
    expect(latest?.id).toBe('0001')
    expect(latest?.generators[0].output).toBe('src/new')
  })

  it('prunes the oldest records by createdAt, not by id', async () => {
    setGlobalConfig({ changeHistoryLimit: 2 })
    vol.mkdirSync('/project/.worma-cache/changes', { recursive: true })
    vol.writeFileSync('/project/.worma-cache/changes/0002.json', JSON.stringify({
      id: '0002',
      createdAt: 10,
      projectPath: '/project',
      generators: [item()],
    }))
    vol.writeFileSync('/project/.worma-cache/changes/0003.json', JSON.stringify({
      id: '0003',
      createdAt: 20,
      projectPath: '/project',
      generators: [item()],
    }))
    vol.writeFileSync('/project/.worma-cache/changes/0001.json', JSON.stringify({
      id: '0001',
      createdAt: 30,
      projectPath: '/project',
      generators: [item()],
    }))

    await captureChange('/project', { createdAt: 40, projectPath: '/project', generators: [item()] })

    expect(await fileNames('/project/.worma-cache/changes')).toEqual(['0001.json', '0004.json'])
  })

  it('does not overwrite the generation-side cache entries when bumping changeSeq', async () => {
    vol.mkdirSync('/project/.worma-cache', { recursive: true })
    vol.writeFileSync('/project/.worma-cache/index.json', JSON.stringify({
      schemaVersion: 1,
      entries: [{ path: 'src/api', serverName: 'Demo', hash: 'h', tags: { user: 't' } }],
    }))

    await captureChange('/project', { createdAt: 1, projectPath: '/project', generators: [item()] })

    const index = JSON.parse(await fs.readFile('/project/.worma-cache/index.json', 'utf-8'))
    expect(index.changeSeq).toBe(1)
    expect(index.entries).toHaveLength(1)
    expect(index.entries[0].hash).toBe('h')
    expect(index.entries[0].tags).toEqual({ user: 't' })
  })
})
