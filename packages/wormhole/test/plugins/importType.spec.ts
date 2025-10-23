import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { importType } from '@/plugins/presets/importType'
import { generateWithPlugin } from '../util'

// Minimal ctx mock used by beforeCodeGenerate
function createCtx(fileName: string, content = 'CONTENT') {
  return {
    fileName,
    renderTemplate: vi.fn().mockResolvedValue(content),
  }
}

// mock fs for integration generation (align with other integration tests)
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
    const returned = plugin.config?.(cfg)

    // Should return the same object reference (plugin mutates and returns cfg)
    expect(returned).toBe(cfg)

    // Should contain all unique identifiers plus pre-existing ones
    expect(cfg.externalTypes).toEqual([
      'Existing',
      'Apis',
      'Foo',
      'Bar',
      'Vue',
    ])

    // Calling config twice should not duplicate
    plugin.config?.(cfg)
    expect(cfg.externalTypes).toEqual([
      'Existing',
      'Apis',
      'Foo',
      'Bar',
      'Vue',
    ])
  })

  it('prepends generated imports to globals.d content', async () => {
    const plugin = importType({
      'bar': ['Apis', 'Foo'],
      '@types/bar': ['Bar'],
      'vue|type': ['Vue'],
    })

    const ctx: any = createCtx('globals.d', '/* globals content */')

    const res = await plugin.beforeCodeGenerate?.(undefined as any, undefined as any, ctx)

    // imports should be inserted AFTER the leading block comment
    expect(res).toMatch(/^\/\* globals content \*\/\nimport \{ Apis, Foo \} from 'bar'/)
    expect(res).toContain('import { Bar } from \'@types/bar\'')
    expect(res).toContain('import type { Vue } from \'vue\'')

    // Ensure renderTemplate was called once
    expect(ctx.renderTemplate).toHaveBeenCalledTimes(1)
  })

  it('does nothing for non-globals files', async () => {
    const plugin = importType({ bar: ['Apis'] })
    const ctx: any = createCtx('some-other.d.ts', 'X')

    const res = await plugin.beforeCodeGenerate?.(undefined as any, undefined as any, ctx)

    expect(res).toBeUndefined()
    // renderTemplate should not be called when fileName is not globals.d
    expect(ctx.renderTemplate).not.toHaveBeenCalled()
  })

  it('integration: injects imports and excludes generated schemas for imported types', async () => {
    const { globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/swagger_2.json'),
      [
        // Bring in an actual schema name used by swagger_2.json definitions
        importType({ '@/models': ['User'] }),
      ],
    )

    // 1) Should inject import at top-level
    expect(globalsFile).toMatch('import { User } from \'@/models\'')

    // 2) Should NOT emit the `interface User { ... }` in schemas block
    expect(globalsFile).not.toMatch(/interface\s+User\s*\{/)

    // 3) But `User` should still be referenced in signatures elsewhere
    expect(globalsFile).toMatch(/\bUser\b/)
  })

  it('integration: supports import type syntax for type-only imports', async () => {
    const { globalsFile } = await generateWithPlugin(
      resolve(__dirname, '../openapis/openapi_301.json'),
      [importType({ 'vue|type': ['Component'] })],
    )
    expect(globalsFile).toMatch('import type { Component } from \'vue\'')
  })
})
