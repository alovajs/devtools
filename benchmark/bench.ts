/* eslint-disable no-console */
/**
 * Worma Template Benchmark — alovaGlobals vs axios 模板性能对比
 *
 * 使用 worma generate() 函数直接调用。
 *
 * 使用方法：
 *   node --import tsx bench.ts
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

// ─── 常量 ──────────────────────────────────────────

const SCALES = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000]
const TEMPLATES = ['alovaGlobals', 'axios'] as const

// ─── 工具函数 ──────────────────────────────────────

function measureDir(dir: string): { fileCount: number, totalSize: number, files: string[] } {
  const files: string[] = []
  let totalSize = 0

  function walk(d: string) {
    if (!existsSync(d))
      return
    const entries = readdirSync(d, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(d, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      }
      else if (entry.isFile()) {
        const rel = fullPath.substring(dir.length + 1)
        files.push(rel)
        try {
          totalSize += statSync(fullPath).size
        }
        catch {
          /* ignore */
        }
      }
    }
  }
  walk(dir)
  return { fileCount: files.length, totalSize, files: files.sort() }
}

function getPackageVersion(name: string): string {
  try {
    const pkgPath = resolve(process.cwd(), 'node_modules', name, 'package.json')
    return JSON.parse(readFileSync(pkgPath, 'utf-8')).version || '?'
  }
  catch { return '?' }
}

function formatBytes(bytes: number): string {
  if (bytes < 0)
    return '-'
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatTime(ms: number): string {
  if (ms < 0)
    return '-'
  if (ms < 1000)
    return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// ─── 主流程 ────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log('  Worma Template Benchmark — alovaGlobals vs axios')
  console.log('═══════════════════════════════════════════════════\n')

  const version = getPackageVersion('worma')
  console.log(`  📦 worma 版本: ${version}\n`)

  const [{ generate }, { alovaGlobals, axios }] = await Promise.all([
    import('worma'),
    import('worma/plugin'),
  ])

  // 清理输出
  rmSync('output', { recursive: true, force: true })
  mkdirSync('output', { recursive: true })

  // 表格头
  console.log('┌──────────────┬────────┬───────────┬──────────┬──────────┬──────────┐')
  console.log('│ 模板         │ 规模   │ 耗时      │ 文件数   │ 总大小   │ 状态     │')
  console.log('├──────────────┼────────┼───────────┼──────────┼──────────┼──────────┤')

  for (const template of TEMPLATES) {
    for (const scale of SCALES) {
      const specFile = resolve('specs', `petstore-${scale}.json`)
      const outputDir = resolve('output', `${template}-${scale}`)

      rmSync(outputDir, { recursive: true, force: true })
      mkdirSync(outputDir, { recursive: true })

      process.stdout.write(`│ ${template.padEnd(12)} │ ${String(scale).padEnd(6)} │ 生成中... `)

      if (!existsSync(specFile)) {
        process.stdout.write('\r')
        console.log(`│ ${template.padEnd(12)} │ ${String(scale).padEnd(6)} │ ${'-'.padEnd(9)} │ ${'-'.padEnd(8)} │ ${'-'.padEnd(8)} │ ${'无spec'.padEnd(8)} │`)
        continue
      }

      const config = {
        generator: [{
          input: specFile,
          output: outputDir,
          serverName: 'Petstore',
          docComment: false,
          plugins: [template === 'axios' ? axios() : alovaGlobals()],
        }],
      }

      const start = performance.now()
      try {
        const results = await generate(config, { force: true })
        const timeMs = Math.round(performance.now() - start)

        if (!results.every(Boolean)) {
          process.stdout.write('\r')
          console.log(`│ ${template.padEnd(12)} │ ${String(scale).padEnd(6)} │ ${formatTime(timeMs).padEnd(9)} │ ${'-'.padEnd(8)} │ ${'-'.padEnd(8)} │ ${'失败'.padEnd(8)} │`)
          continue
        }

        const { fileCount, totalSize } = measureDir(outputDir)

        process.stdout.write('\r')
        console.log(`│ ${template.padEnd(12)} │ ${String(scale).padEnd(6)} │ ${formatTime(timeMs).padEnd(9)} │ ${String(fileCount).padEnd(8)} │ ${formatBytes(totalSize).padEnd(8)} │ ${'成功'.padEnd(8)} │`)
      }
      catch {
        const timeMs = Math.round(performance.now() - start)
        process.stdout.write('\r')
        console.log(`│ ${template.padEnd(12)} │ ${String(scale).padEnd(6)} │ ${formatTime(timeMs).padEnd(9)} │ ${'-'.padEnd(8)} │ ${'-'.padEnd(8)} │ ${'失败'.padEnd(8)} │`)
      }
    }
  }

  console.log('└──────────────┴────────┴───────────┴──────────┴──────────┴──────────┘')
  console.log()
}

main().catch((e) => {
  console.error('Benchmark failed:', e)
  process.exit(1)
})
