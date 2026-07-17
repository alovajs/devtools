import type { ProgressTracker } from '@/helper'
import type { GeneratorConfig } from '@/type'
import { cloneDeep, mergeWith } from 'lodash'
import { PluginDriver } from '@/helper'

export function extendsConfig(config: GeneratorConfig, newConfig: Partial<GeneratorConfig>): GeneratorConfig {
  const mergedConfig = cloneDeep(config)

  return mergeWith(mergedConfig, newConfig, (srcValue, newValue, key) => {
    if (key !== 'handleApi') {
      return newValue ?? srcValue // fallback to default merge behavior
    }

    // handleApi is a special case, we need to merge the functions
    if (typeof newValue === 'function' && typeof srcValue === 'function') {
      // Avoid chaining the same function reference with itself (idempotency guard).
      if (newValue === srcValue) {
        return newValue
      }
      // chain the functions
      return (...args: any[]) => {
        const result = srcValue(...args)
        // null or undefined return is a valid value for filtering
        // if plugin return undefined or null, we should break the chain
        if (!result) {
          return result
        }
        return newValue(result)
      }
    }

    return newValue ?? srcValue // fallback to default merge behavior
  })
}

export async function prepareConfig(
  config: GeneratorConfig,
  projectPath: string = process.cwd(),
  tracker?: ProgressTracker,
): Promise<GeneratorConfig> {
  let _config = cloneDeep(config)

  const plugins = _config.plugins || []

  const reporter = (plugin: { name?: string }) =>
    tracker?.reporterFor(plugin.name ?? 'plugin') ?? (() => {}) as any
  const pluginDriver = new PluginDriver(plugins, { reporter })
  // plugin: handle config hook
  _config = await pluginDriver.hookSeqEach('config', (_plugin, prevResult, _ctx) => {
    const nextConfig = prevResult ?? _config
    return { config: nextConfig, projectPath }
  }) ?? _config
  return _config
}

export default prepareConfig
