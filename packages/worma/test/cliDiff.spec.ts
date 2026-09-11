import { vol } from 'memfs'
import { actionDiff, printRecordedChanges } from '@/bin/actions'

vi.mock('node:fs')
vi.mock('node:fs/promises')

const CACHE = `${process.cwd()}/.worma-cache/changes`

/** Legacy record: api-level lists, upgraded by the reader. */
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

/** Legacy record with a removal and a modification. */
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

/** Current (v1) record: flat source-document rows, one row per affected API. */
const record3 = {
  schemaVersion: 1,
  id: '0003',
  createdAt: 1700000200000,
  projectPath: process.cwd(),
  generators: [
    {
      output: 'src/api',
      serverName: 'Demo',
      resolvedInput: 'spec.json',
      changes: [
        { op: '+', kind: 'api', target: 'GET /pets', detail: 'listPets', level: 'additive' },
        { op: '-', kind: 'api', target: 'DELETE /pets/{id}', level: 'breaking' },
        { op: '+', kind: 'param', target: 'POST /pets', item: 'query.limit', detail: 'number?', level: 'additive' },
        { op: '~', kind: 'param', target: 'POST /pets', item: 'query.status.required', detail: 'false -> true', level: 'breaking' },
        { op: '~', kind: 'body', target: 'POST /pets', item: 'requestBody.application/json.properties.name.type', detail: '"string" -> "integer"', level: 'breaking' },
        // one row per component change; the affected operations travel in `affects`
        { op: '+', kind: 'comp', target: '#/components/schemas/Pet', item: 'properties.status.enum', detail: '+"sold"', level: 'additive', affects: ['GET /store/order/{orderId}', 'POST /store/order'] },
        { op: '~', kind: 'api', target: 'POST /pets', item: 'summary', detail: '"create pet" -> "add pet"', level: 'doc' },
        { op: '~', kind: 'meta', target: '#/info', item: 'info.version', detail: '"1.0.0" -> "1.1.0"', level: 'breaking' },
      ],
    },
    { output: 'src/empty', serverName: 'Empty', changes: [] },
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
    const record4 = { ...record2, id: '0003' }
    vol.fromJSON({
      [`${CACHE}/0001.json`]: JSON.stringify(record1),
      [`${CACHE}/0002.json`]: JSON.stringify(record2),
      [`${CACHE}/0003.json`]: JSON.stringify(record4),
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

  describe('source-document (v1) records', () => {
    beforeEach(() => {
      vol.fromJSON({
        [`${CACHE}/0001.json`]: JSON.stringify(record1),
        [`${CACHE}/0002.json`]: JSON.stringify(record2),
        [`${CACHE}/0003.json`]: JSON.stringify(record3),
      })
    })

    it('renders every change as one row of a single table', async () => {
      await actionDiff('0003', {})

      const output = logs.join('\n')
      for (const header of ['TYPE', 'TARGET', 'ITEM', 'CHANGE', 'LEVEL'])
        expect(output).toContain(header)

      // api / param / body / comp / meta rows are all present
      expect(output).toContain('GET /pets')
      expect(output).toContain('query.limit')
      expect(output).toContain('query.status.required')
      expect(output).toContain('requestBody.application/json.properties.name.type')
      expect(output).toContain('#/components/schemas/Pet')
      expect(output).toContain('properties.status.enum')
      expect(output).toContain('info.version')
      expect(output).toContain('breaking')
      expect(output).toContain('additive')
      expect(output).toContain('doc')
    })

    it('keeps the component as target and lists the affected APIs in the change cell', async () => {
      await actionDiff('0003', {})

      const output = logs.join('\n')
      // the component path stays in TARGET, the field in ITEM
      expect(output).toContain('#/components/schemas/Pet')
      expect(output).toContain('properties.status.enum')
      // and the affected operations are listed next to `+"sold"`
      expect(output).toContain('+"sold"')
      expect(output).toContain('GET /store/order/{orderId}')
      expect(output).toContain('POST /store/order')
    })

    it('totals the rows and shows `no changes` for an unchanged generator', async () => {
      await actionDiff('0003', {})

      const output = logs.join('\n')
      expect(output).toContain('+3 added')
      expect(output).toContain('-1 removed')
      expect(output).toContain('~4 modified')
      expect(output).toContain('no changes')
    })

    it('counts v2 rows in the list view', async () => {
      await actionDiff(undefined, {})

      expect(logs.join('\n')).toContain('+3 / -1 / ~4')
    })
  })
})

describe('`worma gen` change pointer', () => {
  beforeEach(() => {
    logs = []
    logSpy = vi.spyOn(console, 'log').mockImplementation((...args: any[]) => {
      logs.push(args.map(String).join(' '))
    })
  })

  afterEach(() => {
    logSpy.mockRestore()
  })

  it('prints the recorded id(s) and the command that shows the details', () => {
    printRecordedChanges([
      { id: '0001', added: 2, removed: 1, modified: 3 },
      { id: '0002', added: 0, removed: 0, modified: 1 },
    ])

    const output = logs.join('\n')
    expect(output).toContain('Changes recorded: 0001, 0002')
    expect(output).toContain('(+2/-1/~4)')
    expect(output).toContain('Run `worma diff latest` to view the details.')
  })

  it('prints nothing when no change record was written', () => {
    printRecordedChanges([])

    expect(logs).toEqual([])
  })
})
