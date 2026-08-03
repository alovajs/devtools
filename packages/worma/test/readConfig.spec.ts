import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readConfig } from '@/index'

/**
 * Regression test: readConfig uses path.resolve to produce an absolute outfile, and try/finally to guarantee cleanup.
 *
 * Before the fix:
 *   1. `path.join(projectPath, 'alova_tmp_xxx.cjs')` produced a relative path under the relative projectPath,
 *      `require()` treated it as a bare module lookup → `Cannot find module 'alova_tmp_xxx.cjs'`.
 *      (`worma gen -p .` triggered this path)
 *   2. after `require(outfile)` threw, `unlink(outfile)` was not executed → temp file left behind.
 *
 * config.spec.ts uses memfs + esbuild mock to pre-fill Module._cache, bypassing the real require
 * path resolution, so it cannot catch this regression; this test therefore uses the real filesystem + real esbuild.
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

/** Write a minimal cjs config that does not depend on external packages to the given directory */
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

/** Assert that no leftover alova_tmp_*.cjs temp bundle files exist in the directory */
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
    // construct a config that compiles successfully but throws at runtime, to verify unlink still runs when require throws
    const projectDir = join(tmpRoot, 'throw-project')
    mkdirSync(projectDir, { recursive: true })
    writeFileSync(
      join(projectDir, 'worma.config.cjs'),
      // the config throws immediately on load, so require(outfile) rejects
      `throw new Error('intentional config load failure');\nmodule.exports = {};\n`,
    )

    await expect(readConfig(projectDir)).rejects.toThrow('intentional config load failure')

    // key: after require throws, try/finally should still clean up the temp file
    // before the fix (unlink after require, without try/finally): require throws → unlink not executed → leftover
    expectNoTempLeftovers(projectDir)
  })
})
