import type { WorkerPool } from '@/core/WorkerPool'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { pickPoolSize, WorkerPool as WorkerPoolClass } from '@/core/WorkerPool'

describe('pickPoolSize', () => {
  // P2: threshold lowered from 200 to 20 so medium-sized APIs also benefit from worker parallelism
  it('returns 0 (no worker pool) when apiCount <= 20', () => {
    expect(pickPoolSize(0)).toBe(0)
    expect(pickPoolSize(1)).toBe(0)
    expect(pickPoolSize(20)).toBe(0)
  })

  it('returns >0 (worker pool enabled) when apiCount > 20', () => {
    expect(pickPoolSize(21)).toBeGreaterThan(0)
    expect(pickPoolSize(200)).toBeGreaterThan(0)
    expect(pickPoolSize(1000)).toBeGreaterThan(0)
    expect(pickPoolSize(5000)).toBeGreaterThan(0)
  })

  it('scales pool size up as apiCount grows', () => {
    const small = pickPoolSize(1000)
    const large = pickPoolSize(5000)
    expect(large).toBeGreaterThanOrEqual(small)
  })
})

describe('workerPool sharedContext serialization', () => {
  // Regression: when apiCount > 200, templateParser enables the worker pool and passes sharedContext via
  // workerData to the worker thread. Node applies structured clone to workerData, so functions cannot be cloned.
  // Before the fix, the caller passed the full generatorConfig (including plugin functions), causing
  // `DataCloneError: ... could not be cloned` and producing 0 files.
  // After the fix, the caller passes only serializable fields (defaultRequire / externalTypes).
  let workerFile: string
  let tmpDir: string
  let pools: WorkerPool<unknown, unknown>[]

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'worma-wp-'))
    workerFile = join(tmpDir, 'echo-worker.cjs')
    // minimal worker: echoes the task key and exposes workerData.config.defaultRequire to verify the shared context is available
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
    // simulate pre-fix: sharedContext.config carries plugins (a function array)
    const pool = new WorkerPoolClass({
      workerScript: workerFile,
      sharedContext: { config: { plugins: [() => { /**/ }, function fn() { /**/ }] } },
      poolSize: 1,
    })
    pools.push(pool)

    await expect(pool.processBatch([{ key: 'a' }])).rejects.toThrow(/could not be cloned|DataCloneError|function/i)
  })

  it('accepts serializable sharedContext (defaultRequire / externalTypes only)', async () => {
    // simulate post-fix: sharedContext.config contains only serializable fields
    const pool = new WorkerPoolClass<{ key: string }, { key: string, result: string }>({
      workerScript: workerFile,
      sharedContext: { config: { defaultRequire: true, externalTypes: ['File', 'Blob'] } },
      poolSize: 1,
    })
    pools.push(pool)

    const results = await pool.processBatch([{ key: 'a' }, { key: 'b' }])
    expect(results).toHaveLength(2)
    expect(results.map(r => r.key).sort()).toEqual(['a', 'b'])
    // worker can read defaultRequire=true from the shared context
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
