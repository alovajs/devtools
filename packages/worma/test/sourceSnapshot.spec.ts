import path from 'node:path'
import { vol } from 'memfs'
import { setGlobalConfig } from '@/config'
import {
  collectSourceChanges,
  readSourceSnapshot,
  snapshotFilePath,
  sourceDocumentHash,
  writeSourceSnapshot,
} from '@/functions/sourceSnapshot'
import { stableStringify } from '@/functions/wormaJson'

vi.mock('node:fs')
vi.mock('node:fs/promises')

const PROJECT = '/project'
const OUTPUT = 'src/api'

function text(document: unknown) {
  return stableStringify(document)
}

function spec(paths: Record<string, any>) {
  return { openapi: '3.0.0', info: { title: 'Demo', version: '1.0.0' }, paths }
}

describe('source snapshots', () => {
  beforeEach(() => {
    vol.reset()
    vol.mkdirSync(PROJECT, { recursive: true })
    setGlobalConfig({ cacheRoot: undefined })
  })

  it('names the snapshot file after the generator output', () => {
    expect(snapshotFilePath(PROJECT, OUTPUT))
      .toBe(path.join(PROJECT, '.worma-cache', 'snapshots', 'src_api.json'))
  })

  it('is keyed by output, not by the shared source', async () => {
    await collectSourceChanges({ projectRoot: PROJECT, outputPath: 'src/a', documentText: text(spec({})) })

    expect(await readSourceSnapshot(PROJECT, 'src/a')).not.toBeNull()
    expect(await readSourceSnapshot(PROJECT, 'src/b')).toBeNull()
  })

  it('establishes the baseline silently on the first run', async () => {
    const changes = await collectSourceChanges({ projectRoot: PROJECT, outputPath: OUTPUT, documentText: text(spec({})) })

    expect(changes).toBeUndefined()
    const snapshot = await readSourceSnapshot(PROJECT, OUTPUT)
    expect(snapshot?.hash).toBe(sourceDocumentHash(text(spec({}))))
    expect(snapshot?.version).toBe(1)
  })

  it('returns nothing and does not rewrite the snapshot when the document is unchanged', async () => {
    const documentText = text(spec({ '/pets': { get: {} } }))
    await collectSourceChanges({ projectRoot: PROJECT, outputPath: OUTPUT, documentText })
    const first = await readSourceSnapshot(PROJECT, OUTPUT)

    const changes = await collectSourceChanges({ projectRoot: PROJECT, outputPath: OUTPUT, documentText })

    expect(changes).toBeUndefined()
    expect((await readSourceSnapshot(PROJECT, OUTPUT))!.updatedAt).toBe(first!.updatedAt)
  })

  it('diffs against the previous snapshot and advances the baseline', async () => {
    await collectSourceChanges({
      projectRoot: PROJECT,
      outputPath: OUTPUT,
      documentText: text(spec({ '/pets': { get: { operationId: 'listPets' } } })),
    })

    const changed = spec({ '/pets': { get: { operationId: 'listPets' } }, '/admins': { get: { operationId: 'listAdmins' } } })
    const changes = await collectSourceChanges({
      projectRoot: PROJECT,
      outputPath: OUTPUT,
      documentText: text(changed),
    })

    expect(changes).toEqual([{ op: '+', kind: 'api', target: 'GET /admins', detail: 'listAdmins', level: 'additive' }])
    expect((await readSourceSnapshot(PROJECT, OUTPUT))!.hash).toBe(sourceDocumentHash(text(changed)))
  })

  it('stores the resolved input on the snapshot', async () => {
    await collectSourceChanges({
      projectRoot: PROJECT,
      outputPath: OUTPUT,
      documentText: text(spec({})),
      resolvedInput: 'https://example.com/spec.json',
    })

    expect((await readSourceSnapshot(PROJECT, OUTPUT))!.resolvedInput).toBe('https://example.com/spec.json')
  })

  it('skips detection without throwing when the document is not JSON-serialisable', async () => {
    const changes = await collectSourceChanges({ projectRoot: PROJECT, outputPath: OUTPUT, documentText: 'undefined' })

    expect(changes).toBeUndefined()
    expect(await readSourceSnapshot(PROJECT, OUTPUT)).toBeNull()
  })

  it('round-trips a snapshot through write/read', async () => {
    await writeSourceSnapshot(PROJECT, OUTPUT, {
      version: 1,
      hash: 'abc',
      updatedAt: 42,
      resolvedInput: 'spec.json',
      doc: { openapi: '3.0.0' },
    })

    const snapshot = await readSourceSnapshot(PROJECT, OUTPUT)
    expect(snapshot).toEqual({
      version: 1,
      hash: 'abc',
      updatedAt: 42,
      resolvedInput: 'spec.json',
      doc: { openapi: '3.0.0' },
    })
  })

  it('ignores a corrupt snapshot file', async () => {
    const file = snapshotFilePath(PROJECT, OUTPUT)
    vol.mkdirSync(path.dirname(file), { recursive: true })
    vol.writeFileSync(file, '{ not json')

    expect(await readSourceSnapshot(PROJECT, OUTPUT)).toBeNull()
  })
})
