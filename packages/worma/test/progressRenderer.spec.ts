import type { GenerateProgress } from '@/type/lib'
import { describe, expect, it } from 'vitest'
import {
  createProgressRenderer,
  formatProgressBar,
  renderProgressSnapshot,
  sortProgressEntries,
} from '@/bin/progressRenderer'

describe('progressRenderer', () => {
  it('formatProgressBar fills proportionally and respects width', () => {
    expect(formatProgressBar(0, 10)).toBe('░░░░░░░░░░')
    expect(formatProgressBar(50, 10)).toBe('█████░░░░░')
    expect(formatProgressBar(100, 10)).toBe('██████████')
  })

  it('formatProgressBar clamps out-of-range values', () => {
    expect(formatProgressBar(-50, 4)).toBe('░░░░')
    expect(formatProgressBar(200, 4)).toBe('████')
  })

  it('sortProgressEntries puts core first and orders plugins alphabetically', () => {
    const snapshot: Record<string, GenerateProgress> = {
      'plugin-b': { source: 'plugin-b', progress: 30 },
      'core': { source: 'core', progress: 80 },
      'plugin-a': { source: 'plugin-a', progress: 10 },
    }
    const sorted = sortProgressEntries(snapshot).map(e => e.source)
    expect(sorted).toEqual(['core', 'plugin-a', 'plugin-b'])
  })

  it('renderProgressSnapshot prints one line per source with optional header', () => {
    const snapshot: Record<string, GenerateProgress> = {
      core: { source: 'core', progress: 60, message: 'parsing' },
      apifox: { source: 'apifox', progress: 25 },
    }
    const output = renderProgressSnapshot(snapshot, { header: 'Generating `./pkg`...', barWidth: 5 })
    const lines = output.split('\n')
    expect(lines[0]).toBe('Generating `./pkg`...')
    expect(lines[1]).toBe('  [core] ███░░  60% parsing')
    expect(lines[2]).toBe('  [apifox] █░░░░  25%')
  })

  it('renderProgressSnapshot omits header when not provided', () => {
    const out = renderProgressSnapshot({ core: { source: 'core', progress: 100 } }, { barWidth: 4 })
    expect(out).toBe('  [core] ████ 100%')
  })

  it('renderProgressSnapshot returns empty string for empty snapshot without header', () => {
    expect(renderProgressSnapshot({}, {})).toBe('')
  })

  it('createProgressRenderer reuses header and updates per call', () => {
    const render = createProgressRenderer('header', { barWidth: 4 })
    const a = render({ core: { source: 'core', progress: 0 } })
    const b = render({ core: { source: 'core', progress: 50 } })
    expect(a.startsWith('header')).toBe(true)
    expect(b.startsWith('header')).toBe(true)
    expect(a).not.toBe(b)
  })
})
