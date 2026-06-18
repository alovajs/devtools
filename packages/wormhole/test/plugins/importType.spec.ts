import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { importType } from '@/plugins/presets/importType'
import { generateWithPlugin } from '../util'

vi.mock('node:fs')
vi.mock('node:fs/promises')

describe('plugins/importType', () => {
  it('merges identifiers into externalTypes and dedupes', () => {
    const plugin = importType({
      'bar': ['Apis', 'Foo'],
      '@types/bar': ['Bar'],
      'vue|type': ['Vue'],
    })

    const cfg: any = { externalTypes: ['Existing'] }
    const returned = plugin.config?.({ config: cfg, projectPath: '' })

    expect(returned).toBe(cfg)
    expect(cfg.externalTypes).toEqual([
      'Existing',
      'Apis',
      'Foo',
      'Bar',
      'Vue',
    ])

    // Calling config twice should not duplicate
    plugin.config?.({ config: cfg, projectPath: '' })
    expect(cfg.externalTypes).toEqual([
      'Existing',
      'Apis',
      'Foo',
      'Bar',
      'Vue',
    ])
  })

  it('should inject imports into globals.d file via beforeFileWrite hook', () => {
    const plugin = importType({
      'bar': ['Apis', 'Foo'],
      '@types/bar': ['Bar'],
      'vue|type': ['Vue'],
    })

    const content = '/* header */\ndeclare global {}'
    const result = plugin.beforeFileWrite?.({ config: {} as any, data: {} as any, filePath: '/output/globals.d.ts', content, projectPath: '', reportProgress: () => {}, meta: { templateType: 'tag' } })

    // Should inject imports into globals.d file
    expect(result).toMatch('import { Apis, Foo } from \'bar\'')
    expect(result).toMatch('import { Bar } from \'@types/bar\'')
    expect(result).toMatch('import type { Vue } from \'vue\'')
  })

  it('should NOT modify non-targeted files', () => {
    const plugin = importType({
      bar: ['Apis', 'Foo'],
    })

    const content = 'const x = 1;'
    const result = plugin.beforeFileWrite?.({ config: {} as any, data: {} as any, filePath: '/output/apiDefinitions.ts', content, projectPath: '', reportProgress: () => {}, meta: { templateType: 'api' } })

    expect(result).toBe(content)
  })

  it('should insert imports after leading block comments', () => {
    const plugin = importType({
      bar: ['Apis'],
    })

    const content = '/* block comment */\ndeclare global {}'
    const result = plugin.beforeFileWrite?.({ config: {} as any, data: {} as any, filePath: '/output/globals.d.ts', content, projectPath: '', reportProgress: () => {}, meta: { templateType: 'tag' } })

    // Import should be after the block comment
    expect(result).toMatch(/^\/\* block comment \*\/\nimport \{ Apis \} from 'bar'/)
  })

  it('should prepend imports when no leading block comment exists', () => {
    const plugin = importType({
      bar: ['Apis'],
    })

    const content = 'declare global {}'
    const result = plugin.beforeFileWrite?.({ config: {} as any, data: {} as any, filePath: '/output/globals.d.ts', content, projectPath: '', reportProgress: () => {}, meta: { templateType: 'tag' } })

    expect(result).toMatch(/^import \{ Apis \} from 'bar'\n/)
  })

  it('should target custom files when specified', () => {
    const plugin = importType(
      { bar: ['Apis'] },
      { files: ['apiDefinitions'] },
    )

    // Non-matching file should be unchanged
    const globalsContent = 'declare global {}'
    const globalsResult = plugin.beforeFileWrite?.({ config: {} as any, data: {} as any, filePath: '/output/globals.d.ts', content: globalsContent, projectPath: '', reportProgress: () => {}, meta: { templateType: 'tag' } })
    expect(globalsResult).toBe(globalsContent)

    // Matching file should be modified
    const apiDefContent = 'const x = 1;'
    const apiDefResult = plugin.beforeFileWrite?.({ config: {} as any, data: {} as any, filePath: '/output/apiDefinitions.ts', content: apiDefContent, projectPath: '', reportProgress: () => {}, meta: { templateType: 'api' } })
    expect(apiDefResult).toMatch('import { Apis } from \'bar\'')
  })

  it('should do nothing when no imports are configured', () => {
    const plugin = importType({})

    const content = 'declare global {}'
    const result = plugin.beforeFileWrite?.({ config: {} as any, data: {} as any, filePath: '/output/globals.d.ts', content, projectPath: '', reportProgress: () => {}, meta: { templateType: 'tag' } })

    expect(result).toBe(content)
  })

  it('integration: excludes generated schemas for imported types via externalTypes', async () => {
    const { globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/swagger_2.json'),
      [importType({ '@/models': ['User'] })],
    )

    expect(globalsFile).not.toMatch(/export\s+interface\s+User\s*\{/)
    expect(globalsFile).toMatch(/\bUser\b/)
  })

  it('integration: injects import statements into globals.d.ts', async () => {
    const { globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [importType({ '@/models': ['CustomType'] })],
    )

    expect(globalsFile).toMatch('import { CustomType } from \'@/models\'')
    expect(globalsFile).toMatch('declare global')
  })

  it('integration: supports type-only imports with pipe syntax', async () => {
    const { globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [importType({ 'vue|type': ['Component'] })],
    )

    expect(globalsFile).toMatch('import type { Component } from \'vue\'')
    expect(globalsFile).toMatch('declare global')
  })
})
