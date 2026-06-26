/**
 * P2: Global reusable WorkerPool manager (singleton factory).
 * Caches pools by key to avoid create/destroy overhead across repeated generate() calls.
 * Workers auto-terminate after idleTimeout (default 30s) of inactivity.
 */
import { WorkerPool } from '@/core/WorkerPool'

export interface PoolManagerOptions {
  /** Unique cache key (e.g. `${projectPath}`) */
  key: string
  workerScript: string
  sharedContext: Record<string, unknown>
  poolSize: number
  idleTimeout?: number
}

export class PoolManager {
  private static instance: PoolManager
  private pools = new Map<string, WorkerPool<any, any>>()

  static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager()
    }
    return PoolManager.instance
  }

  private constructor() {}

  get<T, R>(options: PoolManagerOptions): WorkerPool<T, R> {
    const { key, workerScript, sharedContext, poolSize, idleTimeout } = options
    let pool = this.pools.get(key) as WorkerPool<T, R> | undefined
    if (!pool) {
      pool = new WorkerPool<T, R>({ workerScript, sharedContext, poolSize, idleTimeout })
      this.pools.set(key, pool)
    }
    return pool
  }

  /** Explicitly terminate and remove a pool (e.g. on project config change). */
  release(key: string): void {
    const pool = this.pools.get(key)
    if (pool) {
      pool.terminate()
      this.pools.delete(key)
    }
  }

  /** Terminate all cached pools. */
  releaseAll(): void {
    for (const [, pool] of this.pools) {
      pool.terminate()
    }
    this.pools.clear()
  }
}
