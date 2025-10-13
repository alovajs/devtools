import type { ApiPlugin, ApiPluginHooks } from '@/type'

type ExcludeNull<T> = Exclude<T, null | undefined | void>

/**
 * PluginDriver manages plugin lifecycle and provides unified hook execution
 * Similar to Rollup's PluginDriver but adapted for wormhole's needs
 */
export class PluginDriver {
  private readonly plugins: ApiPlugin[]

  constructor(plugins: ApiPlugin[] = []) {
    this.plugins = plugins.filter(Boolean) // Remove null/undefined plugins
  }

  async runHook<H extends ApiPluginHooks, P extends NonNullable<ApiPlugin[H]>>(
    name: H,
    args: Parameters<P>,
    plugin: ApiPlugin,
  ): Promise<ReturnType<P> | undefined> {
    return Promise.resolve()
      .then(() => {
        const handler = (plugin as any)[name]
        if (typeof handler !== 'function') {
          return null
        }

        const result = handler.apply(plugin, args)
        return result
      })
  }

  /**
   * Execute hooks sequentially
   */
  async hookSeq<H extends ApiPluginHooks, P extends NonNullable<ApiPlugin[H]>>(
    name: H,
    args: Parameters<P>,
    resultFn: (result: Awaited<ReturnType<P>>, args: Parameters<P>) => Parameters<P>,
  ): Promise<ExcludeNull<Awaited<ReturnType<P>>>> {
    let promise: Promise<unknown> = Promise.resolve()
    for (const plugin of this.plugins) {
      promise = promise.then(result => this.runHook(name, resultFn(result as any, args), plugin))
    }

    return promise as Promise<ExcludeNull<Awaited<ReturnType<P>>>>
  }

  /**
   * Execute hooks until first non-null result
   */
  async hookFirst<H extends ApiPluginHooks, P extends NonNullable<ApiPlugin[H]>>(
    name: H,
    args: Parameters<P>,
  ): Promise<ExcludeNull<ReturnType<P>>> {
    for (const plugin of this.plugins) {
      const result = await this.runHook(name, args, plugin)
      if (result) {
        return result as ExcludeNull<ReturnType<P>>
      }
    }
    return Promise.resolve(null) as Promise<ExcludeNull<ReturnType<P>>>
  }

  /**
   * Execute hooks in parallel
   */
  async hookParallel<H extends ApiPluginHooks, P extends NonNullable<ApiPlugin[H]>>(
    name: H,
    args: Parameters<P>,
  ): Promise<void> {
    const parallelPromises: Promise<unknown>[] = []
    for (const plugin of this.plugins) {
      parallelPromises.push(this.runHook(name, args, plugin))
    }

    await Promise.all(parallelPromises)
  }
}

export default PluginDriver
