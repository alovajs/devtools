import type { GeneratorConfig } from '@/type'
import { describe, expect, it } from 'vitest'
import { platform } from '@/plugins/presets/platform'
import { alovaGlobals } from '@/plugins'

type Req = { config: GeneratorConfig; projectPath: string; reportProgress: () => void }
const noop = () => { }

const makeConfig = (overrides?: Partial<GeneratorConfig>): GeneratorConfig => ({
  input: 'https://petstore3.swagger.io',
  output: 'xxx',
  plugins: [alovaGlobals()],
  ...overrides,
})

describe('platform preset plugin - config', () => {
  describe('swagger platform', () => {
    it('should set input to an array of swagger URLs + baseUrl fallback', async () => {
      const plugin = platform('swagger')
      const next = (await plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }))!

      expect(Array.isArray(next.input)).toBe(true)
      expect(next.input).toEqual([
        'https://petstore3.swagger.io/openapi.json',
        'https://petstore3.swagger.io/v2/swagger.json',
        'https://petstore3.swagger.io/api/v3/openapi.json',
        'https://petstore3.swagger.io',
      ])
    })

    it('should normalize trailing slash in base URL', async () => {
      const plugin = platform('swagger')
      const next = (await plugin.config!({ config: makeConfig({ input: 'https://petstore3.swagger.io/' }), projectPath: '', reportProgress: noop }))!

      expect(next.input).toEqual([
        'https://petstore3.swagger.io/openapi.json',
        'https://petstore3.swagger.io/v2/swagger.json',
        'https://petstore3.swagger.io/api/v3/openapi.json',
        'https://petstore3.swagger.io/',
      ])
    })
  })

  describe('knife4j platform', () => {
    it('should set input to an array of knife4j URLs + baseUrl fallback', async () => {
      const plugin = platform('knife4j')
      const next = (await plugin.config!({ config: makeConfig({ input: 'https://openapi3.demo.knife4jnext.com' }), projectPath: '', reportProgress: noop }))!

      expect(Array.isArray(next.input)).toBe(true)
      expect(next.input).toEqual([
        'https://openapi3.demo.knife4jnext.com/v3/api-docs',
        'https://openapi3.demo.knife4jnext.com/v2/api-docs',
        'https://openapi3.demo.knife4jnext.com',
      ])
    })
  })

  describe('fastapi platform', () => {
    it('should set input to fastapi openapi.json + baseUrl fallback', async () => {
      const plugin = platform('fastapi')
      const next = (await plugin.config!({ config: makeConfig({ input: 'http://fastapi-example.dokkuapp.com' }), projectPath: '', reportProgress: noop }))!

      expect(Array.isArray(next.input)).toBe(true)
      expect(next.input).toEqual([
        'http://fastapi-example.dokkuapp.com/openapi.json',
        'http://fastapi-example.dokkuapp.com',
      ])
    })
  })

  describe('yapi platform', () => {
    it('should keep input as-is for yapi', async () => {
      const plugin = platform('yapi')
      const yapiUrl = 'http://yapi.demo.qunar.com/api/open/plugin/export?type=swagger&pid=123&token=abc'
      const next = (await plugin.config!({ config: makeConfig({ input: yapiUrl }), projectPath: '', reportProgress: noop }))!

      expect(Array.isArray(next.input)).toBe(true)
      expect(next.input).toEqual([yapiUrl])
    })
  })

  describe('input edge cases', () => {
    it('should work when input is a plain string', async () => {
      const plugin = platform('swagger')
      const next = (await plugin.config!({ config: makeConfig({ input: 'https://petstore.example.com' }), projectPath: '', reportProgress: noop }))!

      expect(Array.isArray(next.input)).toBe(true)
      expect(next.input).toContain('https://petstore.example.com/openapi.json')
      expect(next.input).toContain('https://petstore.example.com')
    })

    it('should deduplicate and flatMap when input is a string array', async () => {
      const plugin = platform('swagger')
      const next = (await plugin.config!({ config: makeConfig({ input: ['https://a.com', 'https://b.com'] as any }), projectPath: '', reportProgress: noop }))!

      expect(Array.isArray(next.input)).toBe(true)
      // Each input generates 4 swagger URLs, then flattened
      expect(next.input).toEqual([
        'https://a.com/openapi.json',
        'https://a.com/v2/swagger.json',
        'https://a.com/api/v3/openapi.json',
        'https://a.com',
        'https://b.com/openapi.json',
        'https://b.com/v2/swagger.json',
        'https://b.com/api/v3/openapi.json',
        'https://b.com',
      ])
    })

    it('should deduplicate repeated items in array input', async () => {
      const plugin = platform('swagger')
      const next = (await plugin.config!({ config: makeConfig({ input: ['https://a.com', 'https://a.com', 'https://b.com'] as any }), projectPath: '', reportProgress: noop }))!

      expect(Array.isArray(next.input)).toBe(true)
      // Duplicates removed before flatMap
      expect(next.input).toEqual([
        'https://a.com/openapi.json',
        'https://a.com/v2/swagger.json',
        'https://a.com/api/v3/openapi.json',
        'https://a.com',
        'https://b.com/openapi.json',
        'https://b.com/v2/swagger.json',
        'https://b.com/api/v3/openapi.json',
        'https://b.com',
      ])
    })

    it('should not modify input when input is not set', async () => {
      const plugin = platform('swagger')
      const cfg = makeConfig() as any
      delete cfg.input
      const next = (await plugin.config!({ config: cfg, projectPath: '', reportProgress: noop })!)

      expect(next?.input).toBeUndefined()
    })

    it('should not modify input when input is an empty string', async () => {
      const plugin = platform('swagger')
      const next = (await plugin.config!({ config: makeConfig({ input: '' }), projectPath: '', reportProgress: noop }))!

      expect(next.input).toBe('')
    })
  })

  describe('plugin name', () => {
    it('should expose plugin name', () => {
      expect(platform('swagger').name).toBe('platform')
    })

    it('should expose correct names for all platform types', () => {
      expect(platform('swagger').name).toBe('platform')
      expect(platform('knife4j').name).toBe('platform')
      expect(platform('fastapi').name).toBe('platform')
      expect(platform('yapi').name).toBe('platform')
    })
  })
})
