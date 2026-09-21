import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ApiChanges from '../src/pages/api-changes.vue'

const listChanges = vi.fn()
const getChange = vi.fn()
const removeChange = vi.fn()

vi.mock('~/hooks/use-handlers', () => ({
  useHandlers: () => ({ listChanges, getChange, removeChange }),
}))

const t = (n: number) => 1_700_000_000_000 + n * 1000

function mkSummary(id: string) {
  return { id, createdAt: t(Number(id)), outputs: ['src/api'], summary: { generators: 1, added: 1, removed: 0, modified: 0 } }
}
function mkRecord(id: string) {
  return {
    schemaVersion: 1,
    id,
    createdAt: t(Number(id)),
    projectPath: '/p',
    generators: [{ output: 'src/api', serverName: 'Demo', resolvedInput: 'api.json', changes: [] }],
  }
}

const detailedRecord = {
  schemaVersion: 1,
  id: '0001',
  createdAt: t(1),
  projectPath: '/p',
  generators: [
    {
      output: 'src/api',
      serverName: 'Demo',
      resolvedInput: 'api.json',
      changes: [
        { op: '+', kind: 'api', target: 'GET /pets', detail: 'listPets', level: 'additive' },
        { op: '-', kind: 'api', target: 'GET /legacy', detail: 'legacyApi', level: 'breaking' },
        { op: '~', kind: 'param', target: 'POST /pets', item: 'query.status.required', detail: 'false -> true', level: 'breaking' },
        { op: '~', kind: 'comp', target: '#/components/schemas/Pet', item: 'properties.status.enum', detail: '+"sold"', level: 'additive', affects: ['GET /pets', 'POST /pets'] },
      ],
    },
  ],
}

let summaries: ReturnType<typeof mkSummary>[] = []

beforeEach(() => {
  summaries = [mkSummary('0001'), mkSummary('0002'), mkSummary('0003')]
  vi.clearAllMocks()
  listChanges.mockImplementation(async () => summaries)
  getChange.mockImplementation(async (_p: string, id: string) =>
    id === 'latest' ? mkRecord('0001') : mkRecord(id),
  )
  removeChange.mockImplementation(async (_p: string, id: string) => {
    const i = summaries.findIndex(s => s.id === id)
    if (i >= 0)
      summaries.splice(i, 1)
    return id
  })
  ;(globalThis as any).__URL__ = {
    path: '/api-changes',
    query: { projectPath: '/p', changeId: 'latest' },
    fragment: {},
  }
})

function setUrl(query: Record<string, string>) {
  ;(globalThis as any).__URL__ = { path: '/api-changes', query, fragment: {} }
}

async function mountAndReady() {
  const wrapper = mount(ApiChanges)
  await flushPromises()
  return wrapper
}

describe('api-changes.vue', () => {
  it('renders the latest record and its rows', async () => {
    summaries = [mkSummary('0001')]
    getChange.mockResolvedValue(detailedRecord)
    const wrapper = await mountAndReady()
    const text = wrapper.text()
    expect(text).toContain('0001')
    expect(text).toContain('GET /pets')
    expect(text).toContain('GET /legacy')
    expect(text).toContain('query.status.required')
    expect(text).toContain('#/components/schemas/Pet')
    expect(text).toContain('properties.status.enum')
    expect(text).toContain('Level')
    expect(text).toContain('Type')
  })

  it('filters rows by the search box', async () => {
    summaries = [mkSummary('0001')]
    getChange.mockResolvedValue(detailedRecord)
    const wrapper = await mountAndReady()
    const inputs = wrapper.findAll('input')
    const searchInput = inputs.find(i => (i.attributes('placeholder') || '').includes('Search'))!
    await searchInput.setValue('legacy')
    await flushPromises()
    expect(wrapper.text()).toContain('GET /legacy')
    expect(wrapper.text()).not.toContain('GET /pets')
  })

  it('pins the dropdown to the concrete record when opened as latest', async () => {
    const wrapper = await mountAndReady()
    expect(wrapper.vm.selectedId).toBe('0001')
  })

  it('after deleting a record switches to the next record', async () => {
    setUrl({ projectPath: '/p', changeId: '0002' })
    const wrapper = await mountAndReady()
    expect(wrapper.vm.selectedId).toBe('0002')
    await wrapper.vm.onDelete()
    await flushPromises()
    expect(removeChange).toHaveBeenCalledWith('/p', '0002')
    // reloaded the list once more, then loaded the following record (0003)
    expect(listChanges).toHaveBeenCalledTimes(2)
    expect(getChange).toHaveBeenLastCalledWith('/p', '0003')
    expect(wrapper.vm.selectedId).toBe('0003')
  })

  it('after deleting the last record switches to the previous record', async () => {
    setUrl({ projectPath: '/p', changeId: '0003' })
    const wrapper = await mountAndReady()
    expect(wrapper.vm.selectedId).toBe('0003')
    await wrapper.vm.onDelete()
    await flushPromises()
    expect(removeChange).toHaveBeenCalledWith('/p', '0003')
    expect(getChange).toHaveBeenLastCalledWith('/p', '0002')
    expect(wrapper.vm.selectedId).toBe('0002')
  })

  it('after deleting the first record switches to the new first record', async () => {
    const wrapper = await mountAndReady()
    expect(wrapper.vm.selectedId).toBe('0001')
    await wrapper.vm.onDelete()
    await flushPromises()
    expect(removeChange).toHaveBeenCalledWith('/p', '0001')
    expect(getChange).toHaveBeenLastCalledWith('/p', '0002')
    expect(wrapper.vm.selectedId).toBe('0002')
  })

  it('does nothing when the deletion is cancelled', async () => {
    removeChange.mockResolvedValue(undefined)
    const wrapper = await mountAndReady()
    await wrapper.vm.onDelete()
    await flushPromises()
    expect(listChanges).toHaveBeenCalledTimes(1)
    expect(getChange).toHaveBeenLastCalledWith('/p', 'latest')
    expect(wrapper.vm.selectedId).toBe('0001')
  })

  it('falls back to latest when the last remaining record is deleted', async () => {
    summaries = [mkSummary('0001')]
    const wrapper = await mountAndReady()
    await wrapper.vm.onDelete()
    await flushPromises()
    expect(removeChange).toHaveBeenCalledWith('/p', '0001')
    expect(getChange).toHaveBeenLastCalledWith('/p', 'latest')
    expect(wrapper.vm.selectedId).toBe('latest')
  })
})
