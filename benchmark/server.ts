/**
 * Benchmark API Server — Hono
 *
 * 独立 HTTP 服务，不依赖 Vite dev server。
 * Dev:   tsx server.ts                → :3101（Vite :3100 代理 /api → 这里）
 * Prod:  tsx server.ts --prod         → :3100，同时 serve dist/ 静态文件
 *
 * SSE 基于 Hono streamSSE，利用 Web Streams 实现真正的流式推送。
 * Runner 使用 spawn 异步执行，事件循环不被阻塞。
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/serve-static'
import { streamSSE } from 'hono/streaming'

const __filename = fileURLToPath(import.meta.url)
const __dirname = resolve(__filename, '..')

const isProd = process.argv.includes('--prod')
const PORT = isProd ? 3100 : 3101

const app = new Hono()

// CORS（允许前端跨域访问）
app.use('/api/*', cors())

// ─── 静态文件服务（生产模式） ──────────────────────────

if (isProd) {
  app.use('/*', serveStatic({ root: resolve(__dirname, 'dist') }))
  app.get('*', serveStatic({ path: resolve(__dirname, 'dist', 'index.html') }))
}

// ─── API 路由 ─────────────────────────────────────────

// 设置 runner 的 baseDir
// eslint-disable-next-line antfu/no-top-level-await
const { setBaseDir, runSingleBenchmarkWithMem, aggregateResults, warmupVersionCache } = await import('./src/server/runner.js')
setBaseDir(__dirname)

/** POST /api/benchmark/run — SSE 流式推送 benchmark 进度与结果 */
app.post('/api/benchmark/run', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const scales: number[] = body.scales || [200, 500, 1000, 5000]
  const iterations: number = body.iterations || 1

  return streamSSE(c, async (stream) => {
    let aborted = false
    stream.onAbort(() => {
      aborted = true
    })

    const rawResults: any[] = []
    const totalSteps = scales.length * 3 * iterations // 3 tools
    let completedSteps = 0

    // 预热版本缓存：在首个 SSE 事件前一次性查询所有工具版本，
    // 避免后续 runSingleBenchmarkWithMem 中 getPackageVersion 阻塞计时
    warmupVersionCache()

    const writeEvent = async (event: string, data: any) => {
      if (aborted)
        return
      try {
        await stream.writeSSE({ event, data: JSON.stringify(data) })
      }
      catch {
        aborted = true
      }
    }

    try {
      for (const scale of scales) {
        for (const tool of ['worma', 'openapi-typescript', '@hey-api/openapi-ts']) {
          for (let i = 0; i < iterations; i++) {
            if (aborted)
              return

            await writeEvent('progress', {
              tool,
              scale,
              iteration: i + 1,
              totalIterations: iterations,
              progress: Math.round((completedSteps / totalSteps) * 100),
              status: 'running',
            })

            const result = await runSingleBenchmarkWithMem(scale, tool)
            rawResults.push(result)
            completedSteps++

            await writeEvent('progress', {
              tool,
              scale,
              iteration: i + 1,
              totalIterations: iterations,
              progress: Math.round((completedSteps / totalSteps) * 100),
              status: result.error ? 'error' : 'done',
              result,
            })
          }
        }
      }

      if (aborted)
        return

      // 聚合结果
      const aggregated = aggregateResults(rawResults)

      // 保存到 results/
      const resultsDir = resolve(__dirname, 'results')
      mkdirSync(resultsDir, { recursive: true })
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const reportData = {
        results: aggregated,
        rawResults,
        timestamp: new Date().toISOString(),
      }
      writeFileSync(
        resolve(resultsDir, 'latest.json'),
        JSON.stringify(reportData, null, 2),
      )
      writeFileSync(
        resolve(resultsDir, `${timestamp}.json`),
        JSON.stringify(reportData, null, 2),
      )

      await writeEvent('complete', reportData)
    }
    catch (e: any) {
      if (!aborted) {
        await writeEvent('error', { message: e.message || String(e) })
      }
    }
  })
})

/** GET /api/benchmark/pre-generated */
app.get('/api/benchmark/pre-generated', (c) => {
  try {
    const resultsPath = resolve(__dirname, 'results', 'latest.json')
    if (existsSync(resultsPath)) {
      const data = JSON.parse(readFileSync(resultsPath, 'utf-8'))
      return c.json(data)
    }
    return c.json({ error: 'No pre-generated results found. Click "Run Benchmark" to generate.' }, 404)
  }
  catch (e: any) {
    return c.json({ error: e.message || 'Internal error' }, 500)
  }
})

/** GET /api/benchmark/history */
app.get('/api/benchmark/history', (c) => {
  try {
    const resultsDir = resolve(__dirname, 'results')
    const files: string[] = []

    if (existsSync(resultsDir)) {
      const entries = readdirSync(resultsDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'latest.json') {
          files.push(entry.name.replace('.json', ''))
        }
      }
      files.sort().reverse()
    }

    return c.json(files)
  }
  catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

/** GET /api/benchmark/history-detail?id=xxx */
app.get('/api/benchmark/history-detail', (c) => {
  try {
    const id = c.req.query('id')
    if (!id) {
      return c.json({ error: 'Missing id parameter' }, 400)
    }

    const filePath = resolve(__dirname, 'results', `${id}.json`)
    if (existsSync(filePath)) {
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      return c.json(data)
    }
    return c.json({ error: 'History not found' }, 404)
  }
  catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// ─── 启动 ─────────────────────────────────────────────

serve({ fetch: app.fetch, port: PORT }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`[benchmark-api] Hono server running → http://localhost:${info.port}`)
  if (isProd) {
    // eslint-disable-next-line no-console
    console.log(`[benchmark-api] Serving static files from dist/`)
  }
  else {
    // eslint-disable-next-line no-console
    console.log(`[benchmark-api] Dev mode — API only (Vite proxies /api here)`)
  }
})
