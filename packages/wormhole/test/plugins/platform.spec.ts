import type { GeneratorConfig } from '@/type'
import { describe, expect, it } from 'vitest'
import { platform } from '@/plugins/presets/platform'
import { alovaGlobals } from '@/plugins'

describe('platform preset plugin - config', () => {
  const baseInputConfig: GeneratorConfig = {
    input: 'https://petstore3.swagger.io',
    output: 'xxx',
    plugins: [alovaGlobals()],
  }

  describe('swagger platform', () => {
    it('should set input to an array of swagger URLs', async () => {
      const plugin = platform('swagger')
      const next = (await plugin.config!({ config: { ...baseInputConfig }, projectPath: '', reportProgress: () => {} })) ?? baseInputConfig

      expect(Array.isArray(next.input)).toBe(true)
      const input = next.input as string[]
      expect(input).toEqual([
        'https://petstore3.swagger.io/api/v3/openapi.json',
        'https://petstore3.swagger.io/v2/swagger.json',
        'https://petstore3.swagger.io/openapi.json',
      ])
    })

    it('should normalize trailing slash in base URL', async () => {
      const plugin = platform('swagger')
      const next = (await plugin.config!({ config: { ...baseInputConfig, input: 'https://petstore3.swagger.io/' }, projectPath: '', reportProgress: () => {} })) ?? baseInputConfig

      const input = next.input as string[]
      expect(input).toEqual([
        'https://petstore3.swagger.io/api/v3/openapi.json',
        'https://petstore3.swagger.io/v2/swagger.json',
        'https://petstore3.swagger.io/openapi.json',
      ])
    })
  })

  describe('knife4j platform', () => {
    it('should set input to an array of knife4j URLs', async () => {
      const plugin = platform('knife4j')
      const next = (await plugin.config!({ config: { ...baseInputConfig, input: 'https://openapi3.demo.knife4jnext.com' }, projectPath: '', reportProgress: () => {} })) ?? baseInputConfig

      expect(Array.isArray(next.input)).toBe(true)
      const input = next.input as string[]
      expect(input).toEqual([
        'https://openapi3.demo.knife4jnext.com/v3/api-docs',
        'https://openapi3.demo.knife4jnext.com/v2/api-docs',
      ])
    })
  })

  describe('fastapi platform', () => {
    it('should set input to fastapi openapi.json URL', async () => {
      const plugin = platform('fastapi')
      const next = (await plugin.config!({ config: { ...baseInputConfig, input: 'http://fastapi-example.dokkuapp.com' }, projectPath: '', reportProgress: () => {} })) ?? baseInputConfig

      expect(Array.isArray(next.input)).toBe(true)
      const input = next.input as string[]
      expect(input).toEqual([
        'http://fastapi-example.dokkuapp.com/openapi.json',
      ])
    })
  })

  describe('yapi platform', () => {
    it('should keep input as-is for yapi', async () => {
      const plugin = platform('yapi')
      const yapiUrl = 'http://yapi.demo.qunar.com/api/open/plugin/export?type=swagger&pid=123&token=abc'
      const next = (await plugin.config!({ config: { ...baseInputConfig, input: yapiUrl }, projectPath: '', reportProgress: () => {} })) ?? baseInputConfig

      expect(Array.isArray(next.input)).toBe(true)
      const input = next.input as string[]
      expect(input).toEqual([yapiUrl])
    })
  })

  describe('plugin name', () => {
    it('should expose plugin name', () => {
      const plugin = platform('swagger')
      expect(plugin.name).toBe('platform')
    })

    it('should expose correct names for all platform types', () => {
      expect(platform('swagger').name).toBe('platform')
      expect(platform('knife4j').name).toBe('platform')
      expect(platform('fastapi').name).toBe('platform')
      expect(platform('yapi').name).toBe('platform')
    })
  })
})
