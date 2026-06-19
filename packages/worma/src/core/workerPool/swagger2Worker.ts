/**
 * 9.3.4: Worker for Swagger2→OpenAPI3 conversion (moved from openApiParser).
 * Handles batches of swagger2 documents via WorkerPool.
 */
import { parentPort } from 'node:worker_threads'
import swagger2openapi from 'swagger2openapi'

interface Swagger2Task {
  openapi: string
  swagger: string
  info: any
  paths: any
  [key: string]: any
}

parentPort?.on('message', async (batch: Swagger2Task[]) => {
  const results: { openapi: any }[] = []
  try {
    for (const data of batch) {
      const result = await swagger2openapi.convertObj(data, { warnOnly: true })
      results.push({ openapi: result.openapi })
    }
    parentPort?.postMessage({ type: 'result', data: results })
  }
  catch (err) {
    parentPort?.postMessage({ type: 'error', message: (err as Error).message })
  }
})
