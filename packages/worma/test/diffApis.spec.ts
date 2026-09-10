import type { Api } from '@/type'
import { apiDiffKey, diffApis, hasApiChanges } from '@/functions/diffApis'

function api(partial: Partial<Api> & { method: string, path: string }): Api {
  return {
    tag: 'default',
    summary: '',
    pathParameters: '',
    queryParameters: '',
    name: 'op',
    response: 'any',
    ...partial,
  } as Api
}

describe('diffApis()', () => {
  it('detects added APIs', () => {
    const result = diffApis([], [api({ method: 'GET', path: '/a', name: 'getA' })])
    expect(result.added).toEqual([{ method: 'GET', path: '/a', name: 'getA', tag: 'default' }])
    expect(result.removed).toEqual([])
    expect(result.modified).toEqual([])
    expect(hasApiChanges(result)).toBe(true)
  })

  it('detects removed APIs', () => {
    const result = diffApis([api({ method: 'GET', path: '/a', name: 'getA' })], [])
    expect(result.removed).toHaveLength(1)
    expect(result.removed[0].path).toBe('/a')
    expect(hasApiChanges(result)).toBe(true)
  })

  it('matches on `method` + `path` so renames are reported as modified', () => {
    const result = diffApis(
      [api({ method: 'GET', path: '/a', name: 'getA' })],
      [api({ method: 'GET', path: '/a', name: 'fetchA' })],
    )
    expect(result.added).toEqual([])
    expect(result.removed).toEqual([])
    expect(result.modified).toHaveLength(1)
    expect(result.modified[0].changedFields).toEqual(['name'])
  })

  it('lists every changed field for a modified API', () => {
    const result = diffApis(
      [api({ method: 'POST', path: '/a', response: 'A', requestBody: 'B1', queryParameters: 'Q1' })],
      [api({ method: 'POST', path: '/a', response: 'A2', requestBody: 'B1', queryParameters: 'Q2' })],
    )
    expect(result.modified).toHaveLength(1)
    expect(result.modified[0].changedFields.sort()).toEqual(['queryParameters', 'response'])
  })

  it('treats a path change as removed + added (no rename inference)', () => {
    const result = diffApis(
      [api({ method: 'GET', path: '/a' })],
      [api({ method: 'GET', path: '/b' })],
    )
    expect(result.removed.map(r => r.path)).toEqual(['/a'])
    expect(result.added.map(a => a.path)).toEqual(['/b'])
    expect(result.modified).toEqual([])
  })

  it('distinguishes APIs that share a path but differ in method', () => {
    const result = diffApis(
      [api({ method: 'GET', path: '/a' })],
      [api({ method: 'POST', path: '/a' })],
    )
    expect(result.removed).toHaveLength(1)
    expect(result.added).toHaveLength(1)
  })

  it('returns an all-empty result when nothing changed', () => {
    const list = [api({ method: 'GET', path: '/a' }), api({ method: 'POST', path: '/b' })]
    const result = diffApis(list, list.map(a => ({ ...a })))
    expect(hasApiChanges(result)).toBe(false)
  })

  it('handles empty inputs on both sides', () => {
    expect(hasApiChanges(diffApis())).toBe(false)
  })

  it('exposes a stable matching key', () => {
    expect(apiDiffKey({ method: 'get', path: '/a' })).toBe('get /a')
    expect(apiDiffKey({ method: 'GET', path: '/a' })).toBe(apiDiffKey({ method: 'get', path: '/a' }))
  })
})
