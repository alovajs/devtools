import type { ApiPlugin } from '@/type'
import { describe, expect, it, vi } from 'vitest'
import { PluginDriver } from '@/helper/PluginDriver'

describe('pluginDriver hook*Each', () => {
  it('hookParallelEach calls each plugin with args produced by the factory', async () => {
    const fooSpy = vi.fn()
    const barSpy = vi.fn()
    const plugins: ApiPlugin[] = [
      { name: 'foo', beforeOpenapiParse: fooSpy },
      { name: 'bar', beforeOpenapiParse: barSpy },
    ]
    const driver = new PluginDriver(plugins)
    await driver.hookParallelEach('beforeOpenapiParse', plugin => ({
      config: { tag: plugin.name } as any,
      projectPath: '/p',
    }))
    expect(fooSpy).toHaveBeenCalledTimes(1)
    expect(fooSpy.mock.calls[0][0].config.tag).toBe('foo')
    expect(barSpy).toHaveBeenCalledTimes(1)
    expect(barSpy.mock.calls[0][0].config.tag).toBe('bar')
  })

  it('hookSeqEach exposes the previous plugin result to the args factory', async () => {
    const calls: Array<{ name: string, prev: any }> = []
    const plugins: ApiPlugin[] = [
      {
        name: 'first',
        openapiParsed: vi.fn(({ document }: any) => ({ ...document, step: 'first' })),
      },
      {
        name: 'second',
        openapiParsed: vi.fn(({ document }: any) => ({ ...document, step: 'second' })),
      },
    ]
    const driver = new PluginDriver(plugins)
    const finalResult = await driver.hookSeqEach('openapiParsed', (plugin, prevResult) => {
      calls.push({ name: plugin.name!, prev: prevResult })
      const document = prevResult ?? { step: 'init' }
      return {
        config: {} as any,
        document,
        projectPath: '/p',
      }
    })

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({ name: 'first', prev: undefined })
    expect(calls[1].name).toBe('second')
    expect(calls[1].prev).toMatchObject({ step: 'first' })
    expect(finalResult).toMatchObject({ step: 'second' })
  })

  it('hookSeqEach returns falsy when no plugin returns a value', async () => {
    const plugins: ApiPlugin[] = [
      { name: 'a' /* no hooks */ },
      { name: 'b' /* no hooks */ },
    ]
    const driver = new PluginDriver(plugins)
    const result = await driver.hookSeqEach('openapiParsed', (_p, prev) => ({
      config: {} as any,
      document: prev ?? ({} as any),
      projectPath: '/p',
    }))
    expect(result == null).toBe(true)
  })
})
