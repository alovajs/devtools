/**
 * Worma Benchmark — OpenAPI 代码生成工具性能对比
 *
 * 对比工具：worma | openapi-typescript | @hey-api/openapi-ts
 *
 * 使用方法：
 *   npm install && npm run bench
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

// ─── 类型定义 ────────────────────────────────────────

interface ToolConfig {
  name: string
  description: string
  /** 是否跳过（如未发布到 npm） */
  skip?: string
  /** 执行生成的函数，返回输出目录 */
  run: () => string
}

interface ToolResult {
  name: string
  version: string
  description: string
  timeMs: number
  fileCount: number
  totalSize: number
  files: string[]
  error?: string
}

// ─── 工具函数 ────────────────────────────────────────

/** 递归统计目录下所有文件的数量和大小 */
function measureDir(dir: string): { fileCount: number; totalSize: number; files: string[] } {
  const files: string[] = []
  let totalSize = 0

  function walk(d: string) {
    if (!existsSync(d)) return
    const entries = readdirSync(d, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(d, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        const rel = fullPath.substring(dir.length + 1)
        files.push(rel)
        try {
          totalSize += statSync(fullPath).size
        } catch {
          // ignore
        }
      }
    }
  }
  walk(dir)
  return { fileCount: files.length, totalSize, files: files.sort() }
}

/** 安全执行命令，返回是否成功 */
function runCmd(cmd: string, cwd?: string): { ok: boolean; stdout: string; stderr: string; timeMs: number } {
  const start = performance.now()
  try {
    const stdout = execSync(cmd, {
      cwd: cwd || process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 60_000,
    })
    const elapsed = performance.now() - start
    return { ok: true, stdout, stderr: '', timeMs: elapsed }
  } catch (e: any) {
    const elapsed = performance.now() - start
    return {
      ok: false,
      stdout: e.stdout?.toString() || '',
      stderr: e.stderr?.toString() || e.message || '',
      timeMs: elapsed,
    }
  }
}

/** 获取 npm 包版本 */
function getPackageVersion(name: string): string {
  try {
    const pkgPath = resolve(process.cwd(), 'node_modules', name, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    return pkg.version || '?'
  } catch {
    return '?'
  }
}

// ─── 工具列表 ────────────────────────────────────────

const TOOLS: ToolConfig[] = [
  {
    name: 'openapi-typescript',
    description: '纯类型生成，单个 .d.ts 文件',
    run: () => {
      const outDir = 'output/openapi-ts'
      mkdirSync(outDir, { recursive: true })
      const outFile = join(outDir, 'schema.d.ts')
      const result = runCmd(`pnpm exec openapi-typescript petstore.json -o ${outFile}`)
      if (!result.ok) throw new Error(result.stderr || 'openapi-typescript failed')
      return outDir
    },
  },
  {
    name: '@hey-api/openapi-ts',
    description: '类型 + 请求客户端，模块化输出',
    run: () => {
      mkdirSync('output/hey-api', { recursive: true })
      // @hey-api/openapi-ts 会自动加载 cwd 下的 openapi-ts.config.ts
      // 注意：-c 是 client 参数而非配置文件参数，不能用于指定配置文件
      const result = runCmd('pnpm exec openapi-ts -f openapi-ts.config.ts')
      if (!result.ok) throw new Error(result.stderr || '@hey-api/openapi-ts failed')
      return 'output/hey-api'
    },
  },
  {
    name: 'worma',
    description: '多模板预设、aiDoc 插件、input fallback',
    run: () => {
      mkdirSync('output/worma', { recursive: true })
      const result = runCmd('pnpm exec worma gen -f')
      if (!result.ok) throw new Error(result.stderr || 'worma generation failed')
      return 'output/worma'
    },
  },
]

// ─── 主流程 ──────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║       Worma Benchmark - OpenAPI Generator Comparison        ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  // 清理输出
  rmSync('output', { recursive: true, force: true })
  mkdirSync('output', { recursive: true })

  const results: ToolResult[] = []

  for (const tool of TOOLS) {
    console.log(`━━━ ${tool.name} ━━━`)

    if (tool.skip) {
      console.log(`  ⏭  跳过: ${tool.skip}\n`)
      results.push({
        name: tool.name,
        version: '-',
        description: tool.description,
        timeMs: -1,
        fileCount: -1,
        totalSize: -1,
        files: [],
        error: tool.skip,
      })
      continue
    }

    const version = getPackageVersion(tool.name)
    console.log(`  📦 版本: ${version}`)
    console.log(`  🏷  描述: ${tool.description}`)

    const startLabel = '  ⏳ 生成中...'
    process.stdout.write(startLabel)

    const before = performance.now()
    let outDir = ''
    try {
      outDir = tool.run()
      const after = performance.now()
      const timeMs = Math.round(after - before)

      // 清除 "生成中..." 行
      process.stdout.write(`\r  ✅ 完成 (${timeMs}ms)\n`)

      const { fileCount, totalSize, files } = measureDir(outDir)
      console.log(`  📁 文件数: ${fileCount}`)
      console.log(`  📏 总大小: ${formatBytes(totalSize)}`)
      if (files.length <= 10) {
        for (const f of files) {
          console.log(`     - ${f}`)
        }
      }
      console.log()

      results.push({
        name: tool.name,
        version,
        description: tool.description,
        timeMs,
        fileCount,
        totalSize,
        files,
      })
    } catch (e: any) {
      const after = performance.now()
      const timeMs = Math.round(after - before)
      process.stdout.write(`\r  ❌ 失败 (${timeMs}ms)\n`)
      console.log(`     ${e.message}\n`)
      results.push({
        name: tool.name,
        version,
        description: tool.description,
        timeMs,
        fileCount: -1,
        totalSize: -1,
        files: [],
        error: e.message,
      })
    }
  }

  // ─── 结果表格 ────────────────────────────────────
  printResults(results)
  printFeatureMatrix()
}

function formatBytes(bytes: number): string {
  if (bytes < 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatTime(ms: number): string {
  if (ms < 0) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function printResults(results: ToolResult[]) {
  console.log('╔══════════════════════════════════════════════════════════════════╗')
  console.log('║                         📊 性能对比结果                         ║')
  console.log('╠════════════════════╤══════════╤══════════╤══════════╤══════════╣')
  console.log('║ 工具               │ 版本     │ 生成耗时 │ 文件数   │ 总大小   ║')
  console.log('╠════════════════════╪══════════╪══════════╪══════════╪══════════╣')

  for (const r of results) {
    const name = r.name.padEnd(19)
    const ver = (r.version || '-').padEnd(9)
    const time = formatTime(r.timeMs).padEnd(9)
    const count = (r.fileCount >= 0 ? String(r.fileCount) : '-').padEnd(9)
    const size = formatBytes(r.totalSize).padEnd(9)
    console.log(`║ ${name}│ ${ver}│ ${time}│ ${count}│ ${size}║`)
  }

  console.log('╚════════════════════╧══════════╧══════════╧══════════╧══════════╝')
  console.log()

  // 找出最快
  const validResults = results.filter(r => r.timeMs > 0)
  if (validResults.length > 0) {
    const fastest = validResults.reduce((a, b) => (a.timeMs < b.timeMs ? a : b))
    const smallest = validResults.reduce((a, b) => (a.totalSize < b.totalSize ? a : b))
    console.log(`  🏆 最快生成: ${fastest.name} (${formatTime(fastest.timeMs)})`)
    console.log(`  📦 最小体积: ${smallest.name} (${formatBytes(smallest.totalSize)})`)
    console.log()
  }
}

function printFeatureMatrix() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║                     🎯 功能特性对比                          ║')
  console.log('╠══════════════════════════╤═══════════╤═══════════╤══════════╣')
  console.log('║ 特性                     │ worma     │ openapi-ts│ @hey-api ║')
  console.log('╠══════════════════════════╪═══════════╪═══════════╪══════════╣')
  console.log('║ 生成类型定义             │ ✅        │ ✅        │ ✅       ║')
  console.log('║ 生成 API 调用函数        │ ✅        │ ❌        │ ✅       ║')
  console.log('║ 请求客户端集成           │ ✅ 多模板 │ ❌        │ ✅       ║')
  console.log('║ 全局式 API (零 import)   │ ✅        │ ❌        │ ❌       ║')
  console.log('║ 多模板预设               │ ✅ 5 套   │ ❌        │ ❌       ║')
  console.log('║ aiDoc AI Skill 文档      │ ✅        │ ❌        │ ❌       ║')
  console.log('║ Input 数组 fallback      │ ✅        │ ❌        │ ❌       ║')
  console.log('║ 极简 JSON 配置 (.wormarc)│ ✅        │ ❌        │ ❌       ║')
  console.log('║ Platform 智能识别        │ ✅        │ ❌        │ ❌       ║')
  console.log('║ 自定义 Handlebars 模板   │ ✅        │ ❌        │ ❌       ║')
  console.log('║ ESM / CJS / TS 多格式    │ ✅        │ TS only   │ TS/ESM  ║')
  console.log('╚══════════════════════════╧═══════════╧═══════════╧══════════╝')
  console.log()

  console.log('─────────────────────────────────────────────────────────────')
  console.log('📝 说明：')
  console.log('  • openapi-typescript 仅生成 TypeScript 类型，不包含请求函数')
  console.log('  • @hey-api/openapi-ts 生成类型 + 请求客户端，但无多模板支持')
  console.log('  • worma 提供 5 套预设模板（alova/alovaGlobals/axios/fetch/ky）')
  console.log('  • 生成耗时受网络环境、CPU 性能等因素影响，多次取平均更准确')
  console.log()
}

main().catch(e => {
  console.error('Benchmark failed:', e)
  process.exit(1)
})
