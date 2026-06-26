import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readConfig } from '@/index'

/**
 * 回归测试：readConfig 用 path.resolve 生成绝对 outfile，并用 try/finally 保证清理。
 *
 * 修复前：
 *   1. `path.join(projectPath, 'alova_tmp_xxx.cjs')` 在相对 projectPath 下产出相对路径，
 *      `require()` 把它当裸模块查找 → `Cannot find module 'alova_tmp_xxx.cjs'`。
 *      （`worma gen -p .` 即触发此路径）
 *   2. `require(outfile)` 抛错后 `unlink(outfile)` 不会执行 → 临时文件残留。
 *
 * config.spec.ts 用 memfs + esbuild mock 预填充 Module._cache，绕过了 require 的真实
 * 路径解析，无法捕获本回归；故此处使用真实文件系统 + 真实 esbuild。
 */

const tmpRoot = join(tmpdir(), `worma-readconfig-${Date.now()}`)

beforeAll(() => {
  mkdirSync(tmpRoot, { recursive: true })
})

afterAll(() => {
  try {
    rmSync(tmpRoot, { recursive: true, force: true })
  }
  catch {
    /* ignore */
  }
})

/** 写一个不依赖外部包的最小 cjs 配置到指定目录 */
function writeMinimalConfig(dir: string) {
  writeFileSync(
    join(dir, 'worma.config.cjs'),
    `module.exports = {
  generator: [
    {
      input: 'http://localhost:3000/openapi.json',
      output: 'src/api',
      type: 'ts',
      plugins: []
    }
  ]
}
`,
  )
}

/** 断言目录下没有残留的 alova_tmp_*.cjs 临时打包文件 */
function expectNoTempLeftovers(dir: string) {
  const leftovers = readdirSync(dir).filter(f => f.startsWith('alova_tmp_'))
  expect(leftovers, `unexpected temp files left behind: ${leftovers.join(', ')}`).toEqual([])
}

describe('readConfig (real fs)', () => {
  it('cleans up temp bundle when projectPath is absolute', async () => {
    const projectDir = join(tmpRoot, 'abs-project')
    mkdirSync(projectDir, { recursive: true })
    writeMinimalConfig(projectDir)

    await readConfig(projectDir)

    expectNoTempLeftovers(projectDir)
  })

  it('cleans up temp bundle even when require throws (try/finally)', async () => {
    // 构造一个会编译成功但运行时抛错的配置文件，验证 require 抛错时 unlink 仍执行
    const projectDir = join(tmpRoot, 'throw-project')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(
      join(projectDir, 'worma.config.cjs'),
      // 配置文件加载时立即抛错，require(outfile) 会 reject
      `throw new Error('intentional config load failure');\nmodule.exports = {};\n`,
    )

    await expect(readConfig(projectDir)).rejects.toThrow('intentional config load failure')

    // 关键：require 抛错后，try/finally 仍应清理临时文件
    // 修复前（unlink 在 require 之后、无 try/finally）：require 抛错 → unlink 不执行 → 残留
    expectNoTempLeftovers(projectDir)
  })
})
