import type { ApiPlugin, ReportProgress } from '@/type'
import { noopReportProgress } from '@/helper/progress'

/** A shared frozen empty context — avoids repeated allocations. */
const CTX: PluginDriverContext = Object.freeze({})

/**
 * PluginDriver — unified plugin hook scheduler.
 *
 * - Constructor accepts a `reporter` factory; all hooks auto-inject `reportProgress`.
 * - Provides three execution strategies: parallelEach, seqEach (chaining), pipe (content transform).
 */
export class PluginDriver {
  private readonly plugins: ApiPlugin[]
  private readonly reporter: (plugin: ApiPlugin) => ReportProgress

  constructor(plugins: ApiPlugin[] = [], opts?: PluginDriverOptions) {
    this.plugins = plugins.filter(Boolean)
    this.reporter = opts?.reporter ?? (() => noopReportProgress)
  }

  // ---- internal ----

  /** Run a single hook on one plugin. Returns the handler's result or null. */
  private async _call(plugin: ApiPlugin, name: string, params: Record<string, any>): Promise<any> {
    const handler = (plugin as any)[name]
    if (typeof handler !== 'function') return null
    return handler.call(plugin, params)
  }

  /** Build full params by auto-injecting reportProgress into the partial object. */
  private _params(plugin: ApiPlugin, partial: Record<string, any>): Record<string, any> {
    return { ...partial, reportProgress: this.reporter(plugin) }
  }

  // ---- public hooks ----

  /**
   * Execute hooks in parallel — each plugin gets independently built params.
   * `makeArgs` returns only hook-specific fields; reportProgress is auto-injected.
   */
  async hookParallelEach(
    name: string,
    makeArgs: (plugin: ApiPlugin, ctx: PluginDriverContext) => Record<string, any>,
  ): Promise<void> {
    await Promise.all(
      this.plugins.map(p => this._call(p, name, this._params(p, makeArgs(p, CTX))))
    )
  }

  /**
   * Execute hooks sequentially — each plugin's result is fed to the next via makeArgs.
   * `prevResult` is the previous plugin's return value (or undefined for the first).
   */
  async hookSeqEach(
    name: string,
    makeArgs: (plugin: ApiPlugin, prevResult: any, ctx: PluginDriverContext) => Record<string, any>,
  ): Promise<any> {
    let prev: any
    for (const plugin of this.plugins) {
      prev = await this._call(plugin, name, this._params(plugin, makeArgs(plugin, prev, CTX)))
    }
    return prev
  }

  /**
   * Pipe a value through all plugins sequentially.
   * Each plugin with the named hook receives the current value and can return a modified one.
   * Plugins without the hook are silently skipped (value passes through unchanged).
   */
  async hookPipe(
    name: string,
    initialValue: string,
    makeArgs: (plugin: ApiPlugin, currentValue: string, ctx: PluginDriverContext) => Record<string, any>,
  ): Promise<string> {
    let current = initialValue
    for (const plugin of this.plugins) {
      const handler = (plugin as any)[name]
      if (typeof handler !== 'function') continue
      const result = await handler.call(plugin, this._params(plugin, makeArgs(plugin, current, CTX)))
      if (typeof result === 'string') current = result
    }
    return current
  }
}

export interface PluginDriverOptions {
  reporter?: (plugin: ApiPlugin) => ReportProgress
}

export interface PluginDriverContext {
  // reserved for future extensions
}

export default PluginDriver
