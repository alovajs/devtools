import type { OpenAPIDocument, SchemaObject } from '@/type'

import type { GeneratorConfig } from '@/type/lib'

/**
 * M4-C1: Worker entry point for schema→TS conversion.
 * Each worker receives shared context (document + config) at startup,
 * then processes batches of schema objects in its own thread.
 */
import { parentPort, workerData } from 'node:worker_threads'
// Initialize global config required by logger etc.
import { setGlobalConfig } from '@/config'
import { astLoader, schemaLoader } from '@/core/loader'

setGlobalConfig({ Error })

interface WorkerSetup {
  document: OpenAPIDocument
  /** 仅包含 worker 所需的可序列化字段（避免传递含函数的 plugins/fetchOptions） */
  config: Pick<GeneratorConfig, 'defaultRequire' | 'externalTypes'>
  refNameMapEntries: [string, string][]
}

interface SchemaBatchItem {
  key: string
  schema: SchemaObject
}

interface SchemaResultItem {
  key: string
  result: string
}

const { document, config, refNameMapEntries } = workerData as WorkerSetup
const refNameMap = new Map<string, string>(refNameMapEntries)

async function processSchema(key: string, schema: SchemaObject): Promise<SchemaResultItem[]> {
  const results: SchemaResultItem[] = []

  const tsStr = await schemaLoader.transform(schema, {
    document,
    deep: false,
    noEnum: true,
    commentType: 'doc',
    preText: '',
    defaultRequire: config.defaultRequire,
    refNameMap,
    async onReference(ast) {
      if (config.externalTypes?.includes(ast.keyName ?? ''))
        return
      if (ast.keyName) {
        const result = await astLoader.transformTsStr(ast, {
          shallowDeep: true,
          commentType: 'doc',
          noEnum: true,
          format: true,
          export: true,
        })
        results.push({ key: ast.keyName, result })
      }
    },
  })

  results.push({ key, result: tsStr })
  return results
}

parentPort?.on('message', async (batch: SchemaBatchItem[]) => {
  try {
    const allResults: SchemaResultItem[] = []
    for (const item of batch) {
      const taskResults = await processSchema(item.key, item.schema)
      allResults.push(...taskResults)
    }
    parentPort?.postMessage({ type: 'result', data: allResults })
  }
  catch (err) {
    parentPort?.postMessage({ type: 'error', message: (err as Error).message })
  }
})
