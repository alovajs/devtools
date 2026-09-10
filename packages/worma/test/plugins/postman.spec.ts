import type { GeneratorConfig } from '@/type'
import { describe, expect, it } from 'vitest'
import { getOpenApiDataWithUrl } from '@/core/parser/openApiParser/helper'
import { postman, unwrapTransformationOutput } from '@/plugins/presets/postman'
import { generateWithPlugin } from '../util'

vi.mock('node:fs')
vi.mock('node:fs/promises')

function configHook(plugin: ReturnType<typeof postman>, config: GeneratorConfig) {
  return plugin.config!({ config, projectPath: '', reportProgress: () => {} })
}

describe('postman preset plugin — unwrapTransformationOutput', () => {
  it('should unwrap a transformation envelope', () => {
    expect(unwrapTransformationOutput(JSON.stringify({ output: '{"openapi":"3.0.3"}' }))).toBe('{"openapi":"3.0.3"}')
  })

  it('should throw when the response is not a transformation envelope', () => {
    // a plain OpenAPI document (envelope already unwrapped) is not valid here
    expect(() => unwrapTransformationOutput('{"openapi":"3.0.3"}'))
      .toThrow(/must be a JSON object with a string `output` field/)
    // an error payload from the Postman API
    expect(() => unwrapTransformationOutput('{"error":{"name":"instanceNotFoundError"}}'))
      .toThrow(/must be a JSON object with a string `output` field/)
    expect(() => unwrapTransformationOutput('null'))
      .toThrow(/must be a JSON object with a string `output` field/)
  })

  it('should throw when the response is not valid JSON', () => {
    expect(() => unwrapTransformationOutput('openapi: 3.0.3'))
      .toThrow(/is not valid JSON/)
    expect(() => unwrapTransformationOutput(''))
      .toThrow(/is not valid JSON/)
  })

  it('should throw when the `output` field is not a string', () => {
    expect(() => unwrapTransformationOutput('{"output":123}'))
      .toThrow(/must be a JSON object with a string `output` field/)
  })
})

describe('postman preset plugin — config', () => {
  const baseInputConfig: GeneratorConfig = {
    input: 'dummy',
    output: 'xxx',
  }

  it('should point input at the transformation endpoint and inject the api key', async () => {
    const plugin = postman({ apiKey: 'PMAK-test', collectionId: 'col-1' })
    const next = (await configHook(plugin, { ...baseInputConfig })) ?? baseInputConfig

    expect(next.input).toBe('https://api.getpostman.com/collections/col-1/transformations')
    expect(next.fetchOptions?.headers).toEqual({ 'x-api-key': 'PMAK-test' })
    expect(next.fetchOptions?.method).toBe('GET')
  })

  it('should keep existing fetch options', async () => {
    const plugin = postman({ apiKey: 'PMAK-test', collectionId: 'col-1' })
    const next = (await configHook(plugin, {
      ...baseInputConfig,
      fetchOptions: { timeout: 5000, headers: { cookie: 'a=b' } },
    })) ?? baseInputConfig

    expect(next.fetchOptions?.timeout).toBe(5000)
    expect(next.fetchOptions?.headers).toEqual({ 'cookie': 'a=b', 'x-api-key': 'PMAK-test' })
  })

  it('should throw when apiKey or collectionId is missing', async () => {
    await expect(configHook(postman({ apiKey: '', collectionId: 'col-1' }), { ...baseInputConfig }))
      .rejects
      .toThrow(/apiKey/)
    await expect(configHook(postman({ apiKey: 'PMAK-test', collectionId: '' }), { ...baseInputConfig }))
      .rejects
      .toThrow(/collectionId/)
  })

  it('should expose plugin name', () => {
    expect(postman({ apiKey: 'PMAK-test', collectionId: 'col-1' }).name).toBe('postman')
  })
})

describe('postman preset plugin — beforeSpecParse', () => {
  it('should unwrap the envelope returned by the transformation endpoint', async () => {
    const plugin = postman({ apiKey: 'PMAK-test', collectionId: 'col-1' })
    const spec = JSON.stringify({ output: '{"openapi":"3.0.3"}' })

    expect(await plugin.beforeSpecParse!({ config: {}, spec, projectPath: '', reportProgress: () => {} }))
      .toBe('{"openapi":"3.0.3"}')
  })
})

describe('postman preset plugin — generate', () => {
  it('should generate from the Postman transformation endpoint via MSW', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin('', [
      postman({ apiKey: 'PMAK-test', collectionId: 'col-1' }),
    ])
    expect(apiDefinitionsFile).toMatchSnapshot()
  })

  const TRANSFORM_URL = 'https://api.getpostman.com/collections/col-1/transformations'

  it('should invoke beforeSpecParse once after fetching, before the openapi validation', async () => {
    let calls = 0
    const result = await getOpenApiDataWithUrl([TRANSFORM_URL], {
      fetchOptions: { headers: { 'x-api-key': 'PMAK-test' } },
      beforeSpecParse: (spec: string) => {
        calls += 1
        return unwrapTransformationOutput(spec)
      },
    })

    expect(calls).toBe(1)
    expect(result.data.openapi).toBeTypeOf('string')
    // `rawText` keeps the untouched response, so the source baseline hash stays
    // consistent with the update-check side (which never runs plugin hooks).
    expect(result.rawText).toContain('"output"')
  })

  it('should validate the document returned by beforeSpecParse, not the raw response', async () => {
    await expect(getOpenApiDataWithUrl([TRANSFORM_URL], {
      fetchOptions: { headers: { 'x-api-key': 'PMAK-test' } },
      beforeSpecParse: () => undefined,
    })).rejects.toThrow(/is not a valid OpenAPI document/)
  })
})
