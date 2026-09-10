import { vol } from 'memfs'
import { actionDiff } from '@/bin/actions'

vi.mock('node:fs')
vi.mock('node:fs/promises')

const CACHE = `${process.cwd()}/.worma-cache/changes`

const record1 = {
  id: '0001',
  createdAt: 1700000000000,
  projectPath: process.cwd(),
  generators: [
    {
      output: 'src/api',
      serverName: 'Demo',
      added: [{ method: 'GET', path: '/pets', name: 'listPets', tag: 'pets' }],
      removed: [],
      modified: [],
    },
  ],
}

const record2 = {
  id: '0002',
  createdAt: 1700000100000,
  projectPath: process.cwd(),
  generators: [
    {
      output: 'src/api',
      serverName: 'Demo',
      added: [],
      removed: [{ method: 'GET', path: '/old', name: 'oldApi', tag: 'misc' }],
      modified: [{ method: 'POST', path: '/pets', name: 'createPet', tag: 'pets', changedFields: ['response'] }],
    },
  ],
}

let logs: string[] = []
let logSpy: ReturnType<typeof vi.spyOn>

describe('`worma diff` command', () => {
  beforeEach(() => {
    vol.reset()
    logs = []
    logSpy = vi.spyOn(console, 'log').mockImplementation((...args: any[]) => {
      logs.push(args.map(String).join(' '))
    })
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('lists recorded changes when no id is given', async () => {
    vol.fromJSON({
      [`${CACHE}/0001.json`]: JSON.stringify(record1),
      [`${CACHE}/0002.json`]: JSON.stringify(record2),
    })

    await actionDiff(undefined, {})

    const output = logs.join('\n')
    expect(output).toContain('0001')
    expect(output).toContain('0002')
    expect(output).toContain('+1 / -0 / ~0')
    // newest first
    expect(output.indexOf('0002')).toBeLessThan(output.indexOf('0001') + output.length)
  })

  it('prints a friendly hint when there is no record', async () => {
    await actionDiff(undefined, {})
    expect(logs.join('\n')).toContain('No change records found')
  })

  it('prints the detail of a single record', async () => {
    vol.fromJSON({ [`${CACHE}/0002.json`]: JSON.stringify(record2) })

    await actionDiff('0002', {})

    const output = logs.join('\n')
    expect(output).toContain('Change 0002')
    expect(output).toContain('/old')
    expect(output).toContain('response')
    expect(output).toContain('+0 added')
    expect(output).toContain('-1 removed')
    expect(output).toContain('~1 modified')
  })

  it('supports the `latest` alias (newest record by file name)', async () => {
    vol.fromJSON({
      [`${CACHE}/0001.json`]: JSON.stringify(record1),
      [`${CACHE}/0002.json`]: JSON.stringify(record2),
    })

    await actionDiff('latest', {})

    expect(logs.join('\n')).toContain('Change 0002')
  })

  it('resolves `latest` by scanning even when index.json changeSeq is stale/missing', async () => {
    const record3 = { ...record2, id: '0003' }
    vol.fromJSON({
      [`${CACHE}/0001.json`]: JSON.stringify(record1),
      [`${CACHE}/0002.json`]: JSON.stringify(record2),
      [`${CACHE}/0003.json`]: JSON.stringify(record3),
      // changeSeq says "1" but the newest file is 0003 — scanning must win.
      [`${process.cwd()}/.worma-cache/index.json`]: JSON.stringify({ schemaVersion: 1, entries: [], changeSeq: 1 }),
    })

    await actionDiff('latest', {})

    expect(logs.join('\n')).toContain('Change 0003')
  })

  it('reports an unknown id', async () => {
    await actionDiff('0099', {})
    expect(logs.join('\n')).toContain('No change record found for "0099"')
  })

  it('honours --list even when an id is passed', async () => {
    vol.fromJSON({ [`${CACHE}/0001.json`]: JSON.stringify(record1) })

    await actionDiff('0001', { list: true })

    const output = logs.join('\n')
    expect(output).toContain('0001')
    expect(output).not.toContain('Change 0001')
  })
})
