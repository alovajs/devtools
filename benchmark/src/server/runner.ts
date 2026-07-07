/**
 * Benchmark Runner Engine
 *
 * 使用 worma 的 generate() 函数直接调用，避免 npx spawn 子进程开销。
 * 通过 process.memoryUsage() 轮询测量进程内内存峰值。
 * 由 benchmark/server.ts 的 Hono 服务直接 import。
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'

// ─── 类型 ────────────────────────────────────────────

export interface BenchmarkResult {
  template: string
  scale: number
  timeMs: number
  /** MB — 进程内 RSS 内存峰值 */
  memoryMB: number
  fileCount: number
  totalSize: number
  files: string[]
  version: string
  error: string | null
}

// ─── 路径解析 ────────────────────────────────────────

function defaultBaseDir(): string {
  try {
    return resolve(fileURLToPath(import.meta.url), '..', '..', '..')
  }
  catch {
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

// ─── 目录统计 ────────────────────────────────────────

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
        catch { /* ignore */ }
      }
    }
  }
  walk(dir)
  return { fileCount: files.length, totalSize, files: files.sort() }
}

// ─── 版本查询 ────────────────────────────────────────

const _versionCache = new Map<string, string>()

export function warmupVersionCache(): void {
  getPackageVersion('worma')
}

function getPackageVersion(name: string): string {
  if (_versionCache.has(name))
    return _versionCache.get(name)!
  try {
    const pkgPath = resolve(baseDir(), 'node_modules', name, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    const ver = pkg.version || '?'
    _versionCache.set(name, ver)
    return ver
  }
  catch {
    _versionCache.set(name, '?')
    return '?'
  }
}

// ─── 进程内内存测量 ──────────────────────────────────

/**
 * 对正在执行的 Promise 进行内存峰值轮询。
 * 返回 { promise, stop }，调用方取 promise 并可在完成后同步获取 peakRSS。
 */
function withMemoryTracking<T>(fn: () => Promise<T>): {
  promise: Promise<T>
  getPeakRSS: () => number
} {
  let peak = process.memoryUsage().rss

  const interval = setInterval(() => {
    // 手动触发 GC（需 --expose-gc）
    try {
      if (typeof globalThis.gc === 'function')
        globalThis.gc()
    }
    catch { /* ignore */ }
    const rss = process.memoryUsage().rss
    if (rss > peak)
      peak = rss
  }, 100)

  const cleanup = () => clearInterval(interval)

  const promise = fn().then(
    (result) => {
      cleanup()
      // 最后一次采样
      const rss = process.memoryUsage().rss
      if (rss > peak)
        peak = rss
      return result
    },
    (err) => {
      cleanup()
      return Promise.reject(err)
    },
  )

  return { promise, getPeakRSS: () => peak }
}

// ─── 主入口 ──────────────────────────────────────────

/**
 * 运行单个 benchmark：使用 worma generate() 直接生成，测量耗时和内存。
 */
export async function runSingleBenchmarkWithMem(scale: number, template: string): Promise<BenchmarkResult> {
  const specFile = resolve(baseDir(), 'specs', `petstore-${scale}.json`)
  const outputDir = resolve(baseDir(), 'output', `${template}-${scale}`)

  rmSync(outputDir, { recursive: true, force: true })
  mkdirSync(outputDir, { recursive: true })

  const version = getPackageVersion('worma')

  // 校验 spec 文件存在
  if (!existsSync(specFile)) {
    return {
      template,
      scale,
      timeMs: -1,
      memoryMB: -1,
      fileCount: -1,
      totalSize: -1,
      files: [],
      version,
      error: `Spec file not found: ${specFile}`,
    }
  }

  try {
    // 动态导入 worma
    const [{ generate }, { alovaGlobals, axios }] = await Promise.all([
      import('wormajs'),
      import('wormajs/plugin'),
    ])

    const config = {
      generator: [
        {
          input: specFile,
          output: outputDir,
          serverName: 'Petstore',
          docComment: false,
          plugins: [template === 'axios' ? axios() : alovaGlobals()],
        },
      ],
    }

    const start = performance.now()

    const { promise, getPeakRSS } = withMemoryTracking(() =>
      generate(config, { force: true, projectPath: baseDir() }),
    )

    const results = await promise
    const timeMs = Math.round(performance.now() - start)
    const memoryMB = Math.round(getPeakRSS() / 1024 / 1024)

    // 检查生成结果
    const allSuccess = results.every(Boolean)
    if (!allSuccess) {
      throw new Error(`worma generate returned partial failure: ${JSON.stringify(results)}`)
    }

    const { fileCount, totalSize, files } = measureDir(outputDir)

    if (fileCount === 0) {
      throw new Error(`worma produced no files in ${outputDir}`)
    }

    return {
      template,
      scale,
      timeMs,
      memoryMB,
      fileCount,
      totalSize,
      files,
      version,
      error: null,
    }
  }
  catch (e: any) {
    return {
      template,
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
