import type { GeneratorConfig } from '@/type'
import { describe, expect, it } from 'vitest'
import { apifox } from '@/plugins/presets/apifox'
import { generateWithPlugin } from '../util'

vi.mock('node:fs')
vi.mock('node:fs/promises')
describe('apifox preset plugin - beforeOpenapiParse', () => {
  const baseInputConfig: Pick<GeneratorConfig, 'input' | 'platform' | 'plugins' | 'fetchOptions'> = {
    input: 'dummy',
    platform: 'swagger',
    plugins: [],
  }

  it('should set ALL scope when selectedTags not provided and construct request', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
    })

    const next = (await plugin.beforeOpenapiParse!(baseInputConfig)) ?? baseInputConfig

    // input URL
    expect(next.input).toBe(
      'https://api.apifox.com/v1/projects/proj-123/export-openapi?locale=zh-CN',
    )

    // headers
    expect(next.fetchOptions?.headers).toEqual({
      'X-Apifox-Api-Version': '2024-03-28',
      'Authorization': 'Bearer token-abc',
    })

    // body defaults
    expect(next.fetchOptions?.data).toEqual({
      scope: {
        excludedByTags: [],
        type: 'ALL',
      },
      options: {
        includeApifoxExtensionProperties: false,
        addFoldersToTags: false,
      },
      oasVersion: '3.0',
      exportFormat: 'JSON',
    })
  })

  it('should set SELECTED_TAGS scope when selectedTags provided', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      selectedTags: ['user', 'order'],
    })

    const next = (await plugin.beforeOpenapiParse!(baseInputConfig)) ?? baseInputConfig
    const data = next.fetchOptions?.data as Record<string, any>
    expect(data.scope?.type).toBe('SELECTED_TAGS')
    expect(data.scope?.selectedTags).toEqual(['user', 'order'])
  })

  it('should encode locale and projectId, and accept overrides', async () => {
    const plugin = apifox({
      projectId: '中文 项目',
      apifoxToken: 'token-abc',
      locale: 'en-US',
      apifoxVersion: '2025-01-01',
      includeApifoxExtensionProperties: true,
      addFoldersToTags: true,
      oasVersion: '3.1',
      exportFormat: 'YAML',
      excludedByTags: ['internal'],
    })

    const next = (await plugin.beforeOpenapiParse!(baseInputConfig)) ?? baseInputConfig

    expect(next.input).toBe(
      'https://api.apifox.com/v1/projects/%E4%B8%AD%E6%96%87%20%E9%A1%B9%E7%9B%AE/export-openapi?locale=en-US',
    )
    expect(next.fetchOptions?.headers).toEqual({
      'X-Apifox-Api-Version': '2025-01-01',
      'Authorization': 'Bearer token-abc',
    })
    expect(next.fetchOptions?.data).toEqual({
      scope: {
        excludedByTags: ['internal'],
        type: 'ALL',
      },
      options: {
        includeApifoxExtensionProperties: true,
        addFoldersToTags: true,
      },
      oasVersion: '3.1',
      exportFormat: 'YAML',
    })
  })

  it('should not modify config when missing projectId or token', async () => {
    const pluginMissingProject = apifox({ apifoxToken: 't', projectId: '' })
    const pluginMissingToken = apifox({ projectId: 'p', apifoxToken: '' })

    const next1 = (await pluginMissingProject.beforeOpenapiParse!(baseInputConfig)) ?? baseInputConfig
    const next2 = (await pluginMissingToken.beforeOpenapiParse!(baseInputConfig)) ?? baseInputConfig

    expect(next1).toEqual(baseInputConfig)
    expect(next2).toEqual(baseInputConfig)
    expect(next1.platform).toBe('swagger')
    expect(next2.plugins).toEqual([])
  })

  it('should expose plugin name', () => {
    const plugin = apifox({ projectId: 'p', apifoxToken: 't' })
    expect(plugin.name).toBe('apifox')
  })

  // Integration: actually use apifox via generateWithPlugin and MSW
  it('should generate using Apifox export endpoint via MSW', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(
      'test-apifox',
      [
        apifox({
          projectId: 'proj-123',
          apifoxToken: 'token-abc',
        }),
      ],
    )
    // The generated definitions should reflect Apifox OpenAPI content
    expect(apiDefinitionsFile).toMatchSnapshot()
  })
})
