import type { WorkerPool } from '@/core/WorkerPool'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { pickPoolSize, WorkerPool as WorkerPoolClass } from '@/core/WorkerPool'

describe('pickPoolSize', () => {
  // 阈值 200 是 worker 池启用的边界：apiCount > 200 才会 spawn worker 线程，
  // 进而触发 sharedContext 的 structured clone。该阈值是 "could not be cloned" bug 的触发前提。
  it('returns 0 (no worker pool) when apiCount <= 200', () => {
    expect(pickPoolSize(0)).toBe(0)
    expect(pickPoolSize(1)).toBe(0)
    expect(pickPoolSize(200)).toBe(0)
  })

  it('returns >0 (worker pool enabled) when apiCount > 200', () => {
    expect(pickPoolSize(201)).toBeGreaterThan(0)
    expect(pickPoolSize(1000)).toBeGreaterThan(0)
    expect(pickPoolSize(5000)).toBeGreaterThan(0)
  })

  it('scales pool size up as apiCount grows', () => {
    const small = pickPoolSize(1000)
    const large = pickPoolSize(5000)
    expect(large).toBeGreaterThanOrEqual(small)
  })
})

describe('WorkerPool sharedContext serialization', () => {
  // 回归：apiCount > 200 时 templateParser 会启用 worker 池并把 sharedContext 通过
  // workerData 传给 worker 线程。Node 对 workerData 做 structured clone，函数无法被克隆。
  // 修复前调用方传入了完整 generatorConfig（含 plugins 函数），导致
  // `DataCloneError: ... could not be cloned`，生成 0 文件。
  // 修复后调用方只传可序列化字段（defaultRequire / externalTypes）。
  let workerFile: string
  let tmpDir: string
  let pools: WorkerPool<unknown, unknown>[]

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'worma-wp-'))
    workerFile = join(tmpDir, 'echo-worker.cjs')
    // 最小 worker：回显任务 key，并暴露 workerData.config.defaultRequire 以验证共享上下文可用
    writeFileSync(workerFile, `"use strict";
const { parentPort, workerData } = require('node:worker_threads');
parentPort.on('message', (batch) => {
  const data = (batch || []).map(function (t) {
    return { key: t.key, result: String(workerData && workerData.config && workerData.config.defaultRequire) };
  });
  parentPort.postMessage({ type: 'result', data: data });
});
`)
  })

  beforeEach(() => {
    pools = []
  })

  afterEach(() => {
    for (const p of pools) p.terminate()
  })

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('rejects sharedContext containing functions (root cause of could-not-be-cloned)', async () => {
    // 模拟修复前：sharedContext.config 携带 plugins（函数数组）
    const pool = new WorkerPoolClass({
      workerScript: workerFile,
      sharedContext: { config: { plugins: [() => { /**/ }, function fn() { /**/ }] } },
      poolSize: 1,
    })
    pools.push(pool)

    await expect(pool.processBatch([{ key: 'a' }])).rejects.toThrow(/could not be cloned|DataCloneError|function/i)
  })

  it('accepts serializable sharedContext (defaultRequire / externalTypes only)', async () => {
    // 模拟修复后：sharedContext.config 仅含可序列化字段
    const pool = new WorkerPoolClass<{ key: string }, { key: string, result: string }>({
      workerScript: workerFile,
      sharedContext: { config: { defaultRequire: true, externalTypes: ['File', 'Blob'] } },
      poolSize: 1,
    })
    pools.push(pool)

    const results = await pool.processBatch([{ key: 'a' }, { key: 'b' }])
    expect(results).toHaveLength(2)
    expect(results.map(r => r.key).sort()).toEqual(['a', 'b'])
    // worker 能读取到共享上下文中的 defaultRequire=true
    expect(results.every(r => r.result === 'true')).toBe(true)
  })

  it('returns empty results for an empty task batch', async () => {
    const pool = new WorkerPoolClass({
      workerScript: workerFile,
      sharedContext: { config: { defaultRequire: false } },
      poolSize: 2,
    })
    pools.push(pool)

    const results = await pool.processBatch([])
    expect(results).toEqual([])
  })

  it('returns empty array and does not spawn workers after terminate()', async () => {
    const pool = new WorkerPoolClass({
      workerScript: workerFile,
      sharedContext: { config: {} },
      poolSize: 1,
    })
    pools.push(pool)
    pool.terminate()

    await expect(pool.processBatch([{ key: 'a' }])).resolves.toEqual([])
  })
})
