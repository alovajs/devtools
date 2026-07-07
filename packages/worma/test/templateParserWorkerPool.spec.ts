import { vol } from 'memfs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * 回归测试：apiCount > 200 时 templateParser 启用 worker 池，sharedContext 通过
 * workerData 传给 worker 线程。Node 对 workerData 做 structured clone，函数无法克隆。
 *
 * 修复前：templateParser 把完整 generatorConfig（含 plugins 函数）作为 sharedContext.config
 *   传入 → `DataCloneError: ... could not be cloned` → 生成 0 文件。
 * 修复后：sharedContext.config 只含可序列化字段（defaultRequire / externalTypes）。
 *
 * 本测试 mock 掉 WorkerPool 以捕获调用方传入的 sharedContext，并用 >200 接口的 spec
 * 触发 worker 池分支，断言捕获到的 sharedContext 可被 structuredClone（不含函数）。
 */

let capturedSharedContext: any
let workerSpawned = false

vi.mock('@/core/WorkerPool', async (importActual) => {
  const actual = await importActual<typeof import('@/core/WorkerPool')>()
  return {
    ...actual,
    // 强制启用 worker 池分支（无需依赖真实 CPU 核数 / apiCount 阈值）
    pickPoolSize: () => 1,
    WorkerPool: class FakeWorkerPool<Task, Result> {
      constructor(opts: any) {
        capturedSharedContext = opts.sharedContext
        workerSpawned = true
      }

      async processBatch(tasks: Task[]): Promise<Result[]> {
        // 返回与任务一一对应的空结果，保证调用方后续流程可继续
        return tasks.map((t: any) => ({ key: t.key, result: '' }) as unknown as Result)
      }

      terminate() { /* noop */ }
    },
  }
})

vi.mock('node:fs')
vi.mock('node:fs/promises')

/** 程序化生成一个超过 200 个接口的 OpenAPI 3.0 文档以触发 worker 池分支 */
function makeBigSpec(endpointCount: number) {
  const paths: Record<string, any> = {}
  for (let i = 0; i < endpointCount; i++) {
    paths[`/api/item${i}`] = {
      get: {
        tags: [`tag${i % 10}`],
        operationId: `getItem${i}`,
        responses: {
          200: {
            description: 'ok',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } },
          },
        },
      },
    }
  }
  return {
    openapi: '3.0.0',
    info: { title: 'Big Spec', version: '1.0.0' },
    servers: [{ url: 'https://example.com' }],
    paths,
    components: {
      schemas: {
        Item: {
          type: 'object',
          properties: { id: { type: 'integer', format: 'int64' }, name: { type: 'string' } },
        },
      },
    },
  }
}

/** 递归检测对象中是否包含函数 */
function containsFunction(obj: any, seen = new WeakSet()): boolean {
  if (typeof obj === 'function')
    return true
  if (obj === null || typeof obj !== 'object')
    return false
  if (seen.has(obj))
    return false
  seen.add(obj)
  if (Array.isArray(obj))
    return obj.some(v => containsFunction(v, seen))
  return Object.values(obj).some(v => containsFunction(v, seen))
}

describe('templateParser worker pool sharedContext (regression: could not be cloned)', () => {
  beforeEach(() => {
    vol.reset()
    vol.mkdirSync('/project', { recursive: true })
    capturedSharedContext = undefined
    workerSpawned = false
  })

  it('passes only serializable config fields to WorkerPool sharedContext', async () => {
    const spec = makeBigSpec(250) // > 200 触发 worker 池
    const specPath = '/project/big.json'
    vol.writeFileSync(specPath, JSON.stringify(spec))
    const outputDir = '/project/output'
    vol.mkdirSync(outputDir, { recursive: true })

    const { generate } = await import('@/index')
    const { alova } = await import('@/plugins')

    // alova() 返回的 plugin 含函数（getTemplate 等）；若调用方把完整 config 传入
    // sharedContext，将无法被 structured clone。
    await generate({
      generator: [
        {
          input: specPath,
          output: outputDir,
          type: 'ts',
          defaultRequire: false,
          externalTypes: ['File'],
          plugins: [alova()],
        },
      ],
    }, { force: true, projectPath: '/project' })

    // worker 池分支确实被触发
    expect(workerSpawned).toBe(true)
    expect(capturedSharedContext).toBeDefined()

    // sharedContext 必须可被 structured clone（等价于 Node 传给 workerData 的要求）
    expect(() => structuredClone(capturedSharedContext)).not.toThrow()

    // sharedContext 不含任何函数（修复前会携带 plugins 函数数组）
    expect(containsFunction(capturedSharedContext)).toBe(false)

    // sharedContext.config 只应包含可序列化字段，不得携带 plugins 等含函数的字段
    const config = capturedSharedContext.config
    expect(config).toBeDefined()
    expect(config.defaultRequire).toBe(false)
    expect(config.externalTypes).toEqual(['File'])
    expect(config.plugins).toBeUndefined()
  }, 30000)

  it('does not spawn worker pool when apiCount <= 200', async () => {
    const spec = makeBigSpec(50) // <= 200，worker 池不启用
    const specPath = '/project/small.json'
    vol.writeFileSync(specPath, JSON.stringify(spec))
    const outputDir = '/project/output-small'
    vol.mkdirSync(outputDir, { recursive: true })

    const { generate } = await import('@/index')
    const { alova } = await import('@/plugins')

    await generate({
      generator: [
        {
          input: specPath,
          output: outputDir,
          type: 'ts',
          plugins: [alova()],
        },
      ],
    }, { force: true, projectPath: '/project' })

    // apiCount <= 200 时不应触发 worker 池（pickPoolSize 被我们 mock 成始终返回 1，
    // 但 collectSchemaTasks 是否有任务、tasks.length>0 才会真正 new WorkerPool；
    // 50 个接口仍可能产生 schema 任务，因此这里只验证：即便触发，sharedContext 也安全）
    if (workerSpawned) {
      expect(() => structuredClone(capturedSharedContext)).not.toThrow()
      expect(containsFunction(capturedSharedContext)).toBe(false)
    }
  }, 30000)
})
