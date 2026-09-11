import { computeSpecHash, normalizeSpecText, stableStringify } from '@/functions/wormaJson'

describe('spec hash (source-level update detection)', () => {
  describe('stableStringify', () => {
    it('is insensitive to object key order', () => {
      expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }))
    })

    it('is insensitive to nested key order', () => {
      expect(stableStringify({ a: { x: 1, y: 2 }, b: [1, 2] }))
        .toBe(stableStringify({ b: [1, 2], a: { y: 2, x: 1 } }))
    })

    it('distinguishes different values', () => {
      expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: 2 }))
    })
  })

  describe('normalizeSpecText', () => {
    it('treats JSON and YAML equivalents as identical', () => {
      const json = '{ "openapi": "3.0.0", "info": { "title": "t", "version": "1" } }'
      const yaml = 'openapi: "3.0.0"\ninfo:\n  title: t\n  version: "1"\n'
      expect(normalizeSpecText(json)).toBe(normalizeSpecText(yaml))
    })

    it('ignores indentation and trailing whitespace', () => {
      const a = '{\n  "a": 1,\n  "b": 2\n}'
      const b = `{"b":2,   "a":1}   \n\n`
      expect(normalizeSpecText(a)).toBe(normalizeSpecText(b))
    })

    it('falls back to the trimmed text for non-structured input', () => {
      expect(normalizeSpecText('  plain text  ')).toBe('plain text')
    })
  })

  describe('computeSpecHash', () => {
    const base = { openapi: '3.0.0', info: { title: 'demo', version: '1.0.0' }, paths: {} }

    it('is stable for the same document written differently', () => {
      const json = JSON.stringify(base)
      const reordered = JSON.stringify({ paths: {}, info: { version: '1.0.0', title: 'demo' }, openapi: '3.0.0' })
      const pretty = JSON.stringify(base, null, 4)
      expect(computeSpecHash(json)).toBe(computeSpecHash(reordered))
      expect(computeSpecHash(json)).toBe(computeSpecHash(pretty))
    })

    it('is stable across JSON / YAML', () => {
      const json = JSON.stringify(base)
      const yaml = 'openapi: "3.0.0"\ninfo:\n  title: demo\n  version: "1.0.0"\npaths: {}\n'
      expect(computeSpecHash(json)).toBe(computeSpecHash(yaml))
    })

    it('changes when the document content changes', () => {
      const changed = JSON.stringify({ ...base, info: { title: 'demo', version: '2.0.0' } })
      expect(computeSpecHash(JSON.stringify(base))).not.toBe(computeSpecHash(changed))
    })

    it('changes when a path is added', () => {
      const withPath = JSON.stringify({ ...base, paths: { '/a': { get: {} } } })
      expect(computeSpecHash(JSON.stringify(base))).not.toBe(computeSpecHash(withPath))
    })

    it('returns a 16-char hex digest', () => {
      expect(computeSpecHash(JSON.stringify(base))).toMatch(/^[0-9a-f]{16}$/)
    })
  })
})
