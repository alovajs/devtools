/**
 * Benchmark Runner Engine
 *
 * 使用 spawn 异步执行子进程，通过 OS 级 RSS 轮询测量真实内存峰值。
 * 由 benchmark/server.ts 的 Hono 服务直接 import。
 */

import { spawn, execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

// ─── 类型 ────────────────────────────────────────────

export interface BenchmarkResult {
  tool: string
  scale: number
  timeMs: number
  /** MB — 子进程树的 RSS 内存峰值（OS 级真实内存） */
  memoryMB: number
  fileCount: number
  totalSize: number
  files: string[]
  version: string
  error: string | null
}

export interface AggregatedResult extends BenchmarkResult {
  avgTimeMs: number
  minTimeMs: number
  maxTimeMs: number
  avgTotalSize?: number
  avgMemoryMB?: number
  iterations: number
}

// ─── 路径解析 ────────────────────────────────────────

function defaultBaseDir(): string {
  try {
    return resolve(fileURLToPath(import.meta.url), '..', '..', '..')
  } catch {
    return process.cwd()
  }
}

let _baseDir = defaultBaseDir()

export function setBaseDir(dir: string) {
  _baseDir = dir
}

function baseDir(): string {
  return _baseDir
}

// ─── OS 级内存测量（子进程 RSS） ────────────────────

/** 获取单个进程的 RSS（KB） */
function getProcessRSS(pid: number): number {
  try {
    const out = execSync(`ps -o rss= -p ${pid}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim()
    return parseInt(out, 10) || 0
  } catch {
    return 0
  }
}

/** 递归获取进程树总 RSS（KB） */
function getProcessTreeRSS(rootPid: number): number {
  let total = getProcessRSS(rootPid)
  try {
    const children = execSync(`pgrep -P ${rootPid} 2>/dev/null || true`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim().split('\n').filter(Boolean)
    for (const cp of children) {
      total += getProcessTreeRSS(parseInt(cp, 10))
    }
  } catch {
    // pgrep 可能不存在，仅取主进程 RSS
  }
  return total
}

// ─── 异步命令执行 + 内存轮询 ──────────────────────────

export interface CmdResult {
  ok: boolean
  stdout: string
  stderr: string
  timeMs: number
  /** 子进程树 RSS 峰值（KB） */
  peakMemoryKB: number
}

/**
 * 异步执行 shell 命令，期间以 100ms 间隔轮询子进程树的 RSS 内存峰值。
 * 使用 spawn + shell 模式，事件循环不被阻塞。
 */
function runCmdAsync(cmd: string, cwd?: string): Promise<CmdResult> {
  const start = performance.now()
  let peakRSS = 0
  let stdout = ''
  let stderr = ''

  return new Promise((resolve) => {
    const child = spawn(cmd, {
      cwd: cwd || baseDir(),
      shell: '/bin/bash',
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    // 超时保护（120s）
    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM')
      // 如果 SIGTERM 后 3 秒还不死，SIGKILL
      setTimeout(() => {
        try { child.kill('SIGKILL') } catch { /* ignore */ }
      }, 3000)
    }, 120_000)

    const memInterval = setInterval(() => {
      try {
        if (child.pid) {
          const rss = getProcessTreeRSS(child.pid)
          if (rss > peakRSS) peakRSS = rss
        }
      } catch {
        // 进程可能已结束
      }
    }, 100)

    child.stdout?.on('data', (d: Buffer) => { stdout += d.toString() })
    child.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })

    child.on('close', (code) => {
      clearTimeout(timeoutId)
      clearInterval(memInterval)

      // 最后一次采样（进程刚结束时 RSS 可能还准确）
      try {
        if (child.pid) {
          const rss = getProcessTreeRSS(child.pid)
          if (rss > peakRSS) peakRSS = rss
        }
      } catch { /* ignore */ }

      const timeMs = Math.round(performance.now() - start)
      resolve({
        ok: code === 0,
        stdout,
        stderr,
        timeMs,
        peakMemoryKB: peakRSS,
      })
    })

    child.on('error', (err) => {
      clearTimeout(timeoutId)
      clearInterval(memInterval)
      const timeMs = Math.round(performance.now() - start)
      resolve({
        ok: false,
        stdout,
        stderr: err.message,
        timeMs,
        peakMemoryKB: peakRSS,
      })
    })
  })
}

// ─── 目录统计 ────────────────────────────────────────

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
        } catch { /* ignore */ }
      }
    }
  }
  walk(dir)
  return { fileCount: files.length, totalSize, files: files.sort() }
}

// ─── 版本查询 ────────────────────────────────────────

/** 缓存包版本，直接读取 node_modules 中的 package.json */
const _versionCache = new Map<string, string>()

/** 预热版本缓存 — 在 benchmark 循环开始前调用，避免阻塞 SSE 流 */
export function warmupVersionCache(): void {
  const tools = ['worma', 'openapi-typescript', '@hey-api/openapi-ts']
  for (const t of tools) getPackageVersion(t)
}

function getPackageVersion(name: string): string {
  if (_versionCache.has(name)) return _versionCache.get(name)!
  try {
    const pkgPath = resolve(baseDir(), 'node_modules', name, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const ver = pkg.version || '?'
    _versionCache.set(name, ver)
    return ver
  } catch {
    _versionCache.set(name, '?')
    return '?'
  }
}

// ─── 各工具运行器（异步） ────────────────────────────

async function runWorma(specFile: string, outputDir: string): Promise<void> {
  const configDir = baseDir()

  // 通过环境变量注入动态 input/output，统一使用根目录的 worma.config.ts
  const envPrefix = `BENCHMARK_SPEC='${specFile}' BENCHMARK_OUTPUT='${outputDir}'`
  const result = await runCmdAsync(`${envPrefix} pnpm exec worma gen -f`, configDir)
  if (!result.ok) throw new Error(result.stderr || 'worma generation failed')

  // 清理 worma 缓存
  const cacheDir = join(configDir, '.worma-cache')
  if (existsSync(cacheDir)) rmSync(cacheDir, { recursive: true, force: true })
}

async function runOpenapiTS(specFile: string, outputDir: string): Promise<void> {
  const outFile = join(outputDir, 'schema.d.ts')
  mkdirSync(outputDir, { recursive: true })
  const result = await runCmdAsync(`npx openapi-typescript '${specFile}' -o '${outFile}'`)
  if (!result.ok) throw new Error(result.stderr || 'openapi-typescript failed')
}

async function runHeyApi(specFile: string, outputDir: string): Promise<void> {
  const configContent = `import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: '${specFile}',
  output: '${outputDir}',
  plugins: ['@hey-api/typescript', '@hey-api/sdk', '@hey-api/client-fetch'],
})
`
  const configPath = join(baseDir(), '.temp-heyapi.config.ts')
  writeFileSync(configPath, configContent)
  mkdirSync(outputDir, { recursive: true })
  try {
    const result = await runCmdAsync(`pnpm exec openapi-ts -f ${configPath}`)
    if (!result.ok) throw new Error(result.stderr || '@hey-api/openapi-ts failed')
  } finally {
    rmSync(configPath, { force: true })
  }
}

// ─── 主入口 ──────────────────────────────────────────

/**
 * 运行单个 benchmark（异步，使用 spawn）
 */
export async function runSingleBenchmark(scale: number, tool: string): Promise<BenchmarkResult> {
  const specFile = resolve(baseDir(), 'specs', `petstore-${scale}.json`)
  const outputDir = resolve(baseDir(), 'output', `${tool}-${scale}-${Date.now()}`)

  rmSync(outputDir, { recursive: true, force: true })
  mkdirSync(outputDir, { recursive: true })

  const version = getPackageVersion(tool)
  const before = performance.now()

  try {
    switch (tool) {
      case 'worma':
        await runWorma(specFile, outputDir)
        break
      case 'openapi-typescript':
        await runOpenapiTS(specFile, outputDir)
        break
      case '@hey-api/openapi-ts':
        await runHeyApi(specFile, outputDir)
        break
      default:
        throw new Error(`Unknown tool: ${tool}`)
    }

    const after = performance.now()
    const { fileCount, totalSize, files } = measureDir(outputDir)

    // memoryMB 将在 server.ts 中由 runCmdAsync 的 peakMemoryKB 计算
    // 这里仅返回 timeMs，memoryMB 由调用方通过 runCmdAsync 返回值填充
    // 但由于 runWorma/runOpenapiTS/runHeyApi 内部已调用 runCmdAsync，
    // 我们需要重构让 memory 能穿透出来。
    // 为了保持接口简洁，我们用 getPackageVersion + 重新统计的方式。
    // 实际上这里无法拿到子进程的 RSS（已在 runCmdAsync 内部消费），
    // 所以我们需要修改架构。

    return {
      tool,
      scale,
      timeMs: Math.round(after - before),
      memoryMB: -1, // placeholder, 由调用方覆盖
      fileCount,
      totalSize,
      files,
      version,
      error: null,
    }
  } catch (e: any) {
    const after = performance.now()
    return {
      tool,
      scale,
      timeMs: Math.round(after - before),
      memoryMB: -1,
      fileCount: -1,
      totalSize: -1,
      files: [],
      version,
      error: e.message || String(e),
    }
  }
}

/**
 * 运行 benchmark 并返回带内存峰值的结果。
 * 这是供 server.ts 调用的主入口，内部使用 spawn 异步执行，
 * 并通过 OS 级 RSS 轮询获取真实内存峰值。
 */
export async function runSingleBenchmarkWithMem(scale: number, tool: string): Promise<BenchmarkResult> {
  const specFile = resolve(baseDir(), 'specs', `petstore-${scale}.json`)
  const outputDir = resolve(baseDir(), 'output', `${tool}-${scale}-${Date.now()}`)

  rmSync(outputDir, { recursive: true, force: true })
  mkdirSync(outputDir, { recursive: true })

  const version = getPackageVersion(tool)

  try {
    let cmdResult: CmdResult

    switch (tool) {
      case 'worma': {
        const configDir = baseDir()

        // 通过环境变量注入动态 input/output，统一使用根目录的 worma.config.ts
        const envPrefix = `BENCHMARK_SPEC='${specFile}' BENCHMARK_OUTPUT='${outputDir}'`
        cmdResult = await runCmdAsync(`${envPrefix} pnpm exec worma gen -f`, configDir)

        // 清理 worma 缓存
        const cacheDir = join(configDir, '.worma-cache')
        if (existsSync(cacheDir)) rmSync(cacheDir, { recursive: true, force: true })

        if (!cmdResult.ok) throw new Error(cmdResult.stderr || 'worma generation failed')
        break
      }
      case 'openapi-typescript': {
        const outFile = join(outputDir, 'schema.d.ts')
        mkdirSync(outputDir, { recursive: true })
        cmdResult = await runCmdAsync(`npx openapi-typescript '${specFile}' -o '${outFile}'`)
        if (!cmdResult.ok) throw new Error(cmdResult.stderr || 'openapi-typescript failed')
        break
      }
      case '@hey-api/openapi-ts': {
        const configContent = `import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: '${specFile}',
  output: '${outputDir}',
  plugins: ['@hey-api/typescript', '@hey-api/sdk', '@hey-api/client-fetch'],
})
`
        const configPath = join(baseDir(), '.temp-heyapi.config.ts')
        writeFileSync(configPath, configContent)
        mkdirSync(outputDir, { recursive: true })
        try {
          cmdResult = await runCmdAsync(`pnpm exec openapi-ts -f ${configPath}`)
        } finally {
          rmSync(configPath, { force: true })
        }
        if (!cmdResult.ok) throw new Error(cmdResult.stderr || '@hey-api/openapi-ts failed')
        break
      }
      default:
        throw new Error(`Unknown tool: ${tool}`)
    }

    const { fileCount, totalSize, files } = measureDir(outputDir)

    return {
      tool,
      scale,
      timeMs: cmdResult.timeMs,
      memoryMB: Math.round(cmdResult.peakMemoryKB / 1024),
      fileCount,
      totalSize,
      files,
      version,
      error: null,
    }
  } catch (e: any) {
    return {
      tool,
      scale,
      timeMs: -1,
      memoryMB: -1,
      fileCount: -1,
      totalSize: -1,
      files: [],
      version,
      error: e.message || String(e),
    }
  }
}

/**
 * @deprecated 兼容旧调用，请使用 runSingleBenchmarkWithMem
 */
export async function runAllBenchmarks(scale: number, tool: string): Promise<BenchmarkResult> {
  return runSingleBenchmarkWithMem(scale, tool)
}

// ─── 结果聚合 ────────────────────────────────────────

export function aggregateResults(rawResults: BenchmarkResult[]): AggregatedResult[] {
  const groups = new Map<string, BenchmarkResult[]>()
  for (const r of rawResults) {
    const key = `${r.tool}-${r.scale}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }

  const aggregated: AggregatedResult[] = []
  for (const [, items] of groups) {
    const valid = items.filter((i) => !i.error && i.timeMs >= 0)
    if (valid.length === 0) {
      aggregated.push({ ...items[0], avgTimeMs: -1, minTimeMs: -1, maxTimeMs: -1, iterations: items.length })
      continue
    }
    const times = valid.map((i) => i.timeMs)
    const mems = valid.filter((i) => i.memoryMB > 0).map((i) => i.memoryMB)

    const avgMem = mems.length > 0
      ? Math.round(mems.reduce((a, b) => a + b, 0) / mems.length)
      : -1

    // avgTotalSize: 取每组的平均 totalSize
    const sizes = valid.map((i) => i.totalSize)
    const avgSize = sizes.length > 0
      ? Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length)
      : -1

    aggregated.push({
      ...valid[0],
      avgTimeMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      minTimeMs: Math.min(...times),
      maxTimeMs: Math.max(...times),
      avgTotalSize: avgSize,
      avgMemoryMB: avgMem,
      iterations: items.length,
    })
  }
  return aggregated
}
