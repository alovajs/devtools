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
      // chain the functions
      return (...args: any[]) => {
        const result = srcValue(...args)
        // null or undefined return is a valid value for filtering
        // if plugin return undefined or null, we should break the chain
        if (result === undefined || result === null) {
          return result
        }
        return newValue(result)
      }
    }

    return newValue ?? srcValue // fallback to default merge behavior
  })
}

export async function prepareConfig(config: GeneratorConfig): Promise<GeneratorConfig> {
  let _config = cloneDeep(config)

  const plugins = _config.plugins || []

  for (const plugin of plugins) {
    if (plugin.extends) {
      const pluginExtendsConfig = typeof plugin.extends === 'function' ? plugin.extends(_config) : plugin.extends
      _config = extendsConfig(_config, pluginExtendsConfig)
    }
  }

  const pluginDriver = new PluginDriver(plugins)
  // plugin: handle config hook
  _config = await pluginDriver.hookSeq('config', [_config]) ?? _config

  return _config
}

export default prepareConfig
