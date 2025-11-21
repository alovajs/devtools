import type { ApifoxOptions } from '@/plugins/presets/apifox'
import type { GeneratorConfig } from '@/type'
import { describe, expect, it } from 'vitest'
import { apifox } from '@/plugins/presets/apifox'
import { generateWithPlugin } from '../util'

vi.mock('node:fs')
vi.mock('node:fs/promises')
describe('apifox preset plugin - config', () => {
  const baseInputConfig: GeneratorConfig = {
    input: 'dummy',
    output: 'xxx',
    platform: 'swagger',
    plugins: [],
  }

  it('should set ALL scope by default and construct request', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
    })

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig

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

  it('should set SELECTED_TAGS scope when scopeType is SELECTED_TAGS', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      scopeType: 'SELECTED_TAGS',
      selectedTags: ['user', 'order'],
    })

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig
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
      scopeType: 'ALL',
    })

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig

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

    const next1 = (await pluginMissingProject.config!(baseInputConfig)) ?? baseInputConfig
    const next2 = (await pluginMissingToken.config!(baseInputConfig)) ?? baseInputConfig

    expect(next1).toEqual(baseInputConfig)
    expect(next2).toEqual(baseInputConfig)
    expect(next1.platform).toBe('swagger')
    expect(next2.plugins).toEqual([])
  })

  it('should expose plugin name', () => {
    const plugin = apifox({ projectId: 'p', apifoxToken: 't' })
    expect(plugin.name).toBe('apifox')
  })

  // Tests for enhanced functionality
  it('should set SELECTED_ENDPOINTS scope when scopeType is SELECTED_ENDPOINTS', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      scopeType: 'SELECTED_ENDPOINTS',
      selectedEndpointIds: [123, 456],
    })

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig
    const data = next.fetchOptions?.data as Record<string, any>
    expect(data.scope?.type).toBe('SELECTED_ENDPOINTS')
    expect(data.scope?.selectedEndpointIds).toEqual([123, 456])
  })

  it('should set SELECTED_FOLDERS scope when scopeType is SELECTED_FOLDERS', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      scopeType: 'SELECTED_FOLDERS',
      selectedFolderIds: [789, 101112],
    })

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig
    const data = next.fetchOptions?.data as Record<string, any>
    expect(data.scope?.type).toBe('SELECTED_FOLDERS')
    expect(data.scope?.selectedFolderIds).toEqual([789, 101112])
  })

  it('should handle new optional parameters correctly', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      scopeType: 'ALL',
      environmentIds: [1, 2],
      branchId: 100,
      moduleId: 200,
    })

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig
    const data = next.fetchOptions?.data as Record<string, any>

    expect(data.environmentIds).toEqual([1, 2])
    expect(data.branchId).toBe(100)
    expect(data.moduleId).toBe(200)
  })

  it('should handle excludedByTags parameter correctly', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      scopeType: 'ALL',
      excludedByTags: ['excludeTag1', 'excludeTag2'],
    })

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig
    const data = next.fetchOptions?.data as Record<string, any>
    expect(data.scope.excludedByTags).toEqual(['excludeTag1', 'excludeTag2'])
  })

  it('should not set selectedTags when it is undefined even in SELECTED_TAGS mode', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      scopeType: 'SELECTED_TAGS',
      // 注意这里没有提供 selectedTags
    })

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig
    // 在新版插件中，selectedTags 有默认值 []，并且在 scopeType 为 SELECTED_TAGS 时始终会被设置
    const data = next.fetchOptions?.data as Record<string, any>
    expect(data.scope.selectedTags).toEqual([])
  })

  it('should set empty array when selectedTags is explicitly set to undefined', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      scopeType: 'SELECTED_TAGS',
      selectedTags: undefined,
    } as ApifoxOptions)

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig
    // 即使显式设置为 undefined，TypeScript 默认参数也会将其转换为空数组
    const data = next.fetchOptions?.data as Record<string, any>
    expect(data.scope.selectedTags).toEqual([])
  })

  it('should set empty array when selectedTags is explicitly set to empty array', async () => {
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      scopeType: 'SELECTED_TAGS',
      selectedTags: [],
    })

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig
    const data = next.fetchOptions?.data as Record<string, any>
    expect(data.scope.selectedTags).toEqual([])
  })

  it('should correctly infer scopeType when not explicitly provided', async () => {
    // 新版插件中不再根据 selectedTags 自动推断 scopeType，而是默认使用 ALL
    const plugin1 = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      selectedTags: ['tag1'],
    })

    const next1 = (await plugin1.config!(baseInputConfig)) ?? baseInputConfig
    // 新版插件默认 scopeType 是 ALL，不会根据 selectedTags 自动推断
    const data1 = next1.fetchOptions?.data as Record<string, any>
    expect(data1.scope.type).toBe('ALL')

    // 当没有提供 selectedTags 也没有指定 scopeType 时，应该默认为 ALL
    const plugin2 = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
    })
    const next2 = (await plugin2.config!(baseInputConfig)) ?? baseInputConfig
    const data2 = next2.fetchOptions?.data as Record<string, any>
    expect(data2.scope.type).toBe('ALL')
  })

  it('should behave like old version when scopeType is not specified but selectedTags is provided (backward compatibility)', async () => {
    // 为了向后兼容，如果需要根据 selectedTags 推断 scopeType，需要显式设置
    const plugin = apifox({
      projectId: 'proj-123',
      apifoxToken: 'token-abc',
      scopeType: 'SELECTED_TAGS',
      selectedTags: ['user', 'order'],
    })

    const next = (await plugin.config!(baseInputConfig)) ?? baseInputConfig
    const data = next.fetchOptions?.data as Record<string, any>
    expect(data.scope?.type).toBe('SELECTED_TAGS')
    expect(data.scope?.selectedTags).toEqual(['user', 'order'])
  })

  // Integration: actually use apifox via generateWithPlugin and MSW
  it('should generate using Apifox export endpoint via MSW', async () => {
    const { apiDefinitionsFile } = await generateWithPlugin(
      '',
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
