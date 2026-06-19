/**
 * 9.3.1: Generic WorkerPool — pure thread pool for task/result patterns.
 * Handles lifecycle, task distribution, and result collection.
 */
import { cpus } from 'node:os'
import { Worker } from 'node:worker_threads'

export function pickPoolSize(apiCount: number): number {
  const cpu = Math.max(1, cpus().length)
  if (apiCount <= 200)
    return 0
  if (apiCount <= 1000)
    return Math.min(2, cpu)
  if (apiCount <= 3000)
    return Math.min(4, cpu)
  if (apiCount <= 8000)
    return Math.min(Math.ceil(cpu * 0.75), cpu)
  return Math.max(2, cpu - 1)
}

export class WorkerPool<Task, Result> {
  private workers: Worker[] = []
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private readonly idleTimeout: number
  private terminated = false

  constructor(private readonly options: {
    workerScript: string
    sharedContext: Record<string, unknown>
    poolSize: number
    idleTimeout?: number
  }) {
    this.idleTimeout = options.idleTimeout ?? 30000
  }

  get size(): number {
    return this.options.poolSize
  }

  /** Spawn workers lazily on first batch */
  private ensureWorkers(): void {
    if (this.workers.length > 0)
      return
    for (let i = 0; i < this.options.poolSize; i++) {
      const w = new Worker(this.options.workerScript, {
        workerData: this.options.sharedContext,
      })
      this.workers.push(w)
    }
    this.resetIdleTimer()
  }

  /** Reset the idle timer — auto-terminate after idleTimeout ms of inactivity */
  private resetIdleTimer(): void {
    if (this.idleTimer)
      clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => this.terminate(), this.idleTimeout)
  }

  /**
   * Process a batch of tasks via the worker pool.
   * Distributes tasks round-robin across workers for even load balancing.
   */
  async processBatch(tasks: Task[]): Promise<Result[]> {
    if (this.terminated)
      return []
    this.ensureWorkers()

    // Round-robin distribution — even load across all workers
    const batches: Task[][] = Array.from({ length: this.workers.length }, () => [])
    tasks.forEach((task, i) => batches[i % this.workers.length].push(task))

    const nonEmpty = batches.filter(b => b.length > 0)
    const results = await Promise.all(
      nonEmpty.map((batch, i) => this.sendToWorker(i, batch)),
    )

    this.resetIdleTimer()
    return results.flat()
  }

  /** Send a batch to a specific worker and wait for result */
  private sendToWorker(workerIdx: number, batch: Task[]): Promise<Result[]> {
    return new Promise((resolve, reject) => {
      const worker = this.workers[workerIdx]
      const handler = (msg: any) => {
        worker.off('message', handler)
        if (msg.type === 'result') {
          resolve(msg.data as Result[])
        }
        else {
          reject(new Error(msg.message ?? 'Unknown worker error'))
        }
      }
      worker.on('message', handler)
      worker.on('error', (err) => {
        worker.off('message', handler)
        reject(err)
      })
      worker.postMessage(batch)
    })
  }

  /** Terminate all workers and cleanup */
  terminate(): void {
    if (this.idleTimer)
      clearTimeout(this.idleTimer)
    this.idleTimer = null
    this.terminated = true
    for (const w of this.workers) {
      w.terminate()
    }
    this.workers.length = 0
  }
}
