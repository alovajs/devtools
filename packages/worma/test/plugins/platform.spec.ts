import type { GeneratorConfig } from '@/type'
import { describe, expect, it } from 'vitest'
import { alovaGlobals } from '@/plugins'
import { fastapi, knife4j, swagger, yapi } from '@/plugins/presets/platform'

// eslint-disable-next-line unused-imports/no-unused-vars
interface Req { config: GeneratorConfig, projectPath: string, reportProgress: () => void }
function noop() { }

function makeConfig(overrides?: Partial<GeneratorConfig>): GeneratorConfig {
  return {
    output: 'xxx',
    plugins: [alovaGlobals()],
    ...overrides,
  }
}

describe('platform preset plugins - config', () => {
  describe('swagger plugin', () => {
    it('should set input to an array of swagger URLs + baseUrl fallback', async () => {
      const plugin = swagger('https://petstore3.swagger.io')
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
      const plugin = swagger('https://petstore3.swagger.io/')
      const next = (await plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }))!

      expect(next.input).toEqual([
        'https://petstore3.swagger.io/openapi.json',
        'https://petstore3.swagger.io/v2/swagger.json',
        'https://petstore3.swagger.io/api/v3/openapi.json',
        'https://petstore3.swagger.io',
      ])
    })

    it('should accept an array of base URLs and deduplicate', async () => {
      const plugin = swagger(['https://a.com', 'https://a.com', 'https://b.com'])
      const next = (await plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }))!

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
  })

  describe('knife4j plugin', () => {
    it('should set input to an array of knife4j URLs + baseUrl fallback', async () => {
      const plugin = knife4j('https://openapi3.demo.knife4jnext.com')
      const next = (await plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }))!

      expect(Array.isArray(next.input)).toBe(true)
      expect(next.input).toEqual([
        'https://openapi3.demo.knife4jnext.com/v3/api-docs',
        'https://openapi3.demo.knife4jnext.com/v2/api-docs',
        'https://openapi3.demo.knife4jnext.com',
      ])
    })
  })

  describe('fastapi plugin', () => {
    it('should set input to fastapi openapi.json + baseUrl fallback', async () => {
      const plugin = fastapi('http://fastapi-example.dokkuapp.com')
      const next = (await plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }))!

      expect(Array.isArray(next.input)).toBe(true)
      expect(next.input).toEqual([
        'http://fastapi-example.dokkuapp.com/openapi.json',
        'http://fastapi-example.dokkuapp.com',
      ])
    })
  })

  describe('yapi plugin', () => {
    const yapiBase = 'http://localhost:3000'

    it('should build the export URL from base url + pid and inject cookie', async () => {
      const plugin = yapi({ url: yapiBase, pid: 123, cookie: '_yapi_token=xxx; _yapi_uid=yyy' })
      const next = (await plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }))!

      expect(next.input).toBe(
        'http://localhost:3000/api/plugin/exportSwagger?type=OpenAPIV2&pid=123&status=all&isWiki=true',
      )
      expect(next.fetchOptions?.headers?.cookie).toBe('_yapi_token=xxx; _yapi_uid=yyy')
    })

    it('should use provided type/status/isWiki overrides', async () => {
      const plugin = yapi({
        url: yapiBase,
        pid: 123,
        cookie: 'c',
        type: 'swagger',
        status: 'done',
        isWiki: false,
      })
      const next = (await plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }))!

      expect(next.input).toBe(
        'http://localhost:3000/api/plugin/exportSwagger?type=swagger&pid=123&status=done&isWiki=false',
      )
    })

    it('should throw when cookie is missing', async () => {
      const plugin = yapi({ url: yapiBase, pid: 123 })
      await expect(
        plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }),
      ).rejects.toThrow(/cookie/)
    })

    it('should throw when url is missing', async () => {
      const plugin = yapi({ pid: 123, cookie: 'x' })
      await expect(
        plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }),
      ).rejects.toThrow(/url/)
    })

    it('should throw when pid is missing', async () => {
      const plugin = yapi({ url: yapiBase, cookie: 'x' })
      await expect(
        plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }),
      ).rejects.toThrow(/pid/)
    })

    it('should fall back to cookie from fetchOptions.headers.cookie', async () => {
      const plugin = yapi({ url: yapiBase, pid: 123 })
      const cfg = makeConfig({ fetchOptions: { headers: { cookie: 'fromHeaders=1' } } })
      const next = (await plugin.config!({ config: cfg, projectPath: '', reportProgress: noop }))!

      expect(next.fetchOptions?.headers?.cookie).toBe('fromHeaders=1')
    })

    it('should set timeout when provided', async () => {
      const plugin = yapi({ url: yapiBase, pid: 123, cookie: 'c', timeout: 5000 })
      const next = (await plugin.config!({ config: makeConfig(), projectPath: '', reportProgress: noop }))!

      expect(next.fetchOptions?.timeout).toBe(5000)
    })
  })

  describe('plugin name', () => {
    it('should expose correct names for each platform plugin', () => {
      expect(swagger('x').name).toBe('swagger')
      expect(knife4j('x').name).toBe('knife4j')
      expect(fastapi('x').name).toBe('fastapi')
      expect(yapi({ url: 'x', pid: 1, cookie: 'c' }).name).toBe('yapi')
    })
  })
})
