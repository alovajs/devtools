import type { GeneratorConfig } from '@/type'
import { cloneDeep, mergeWith } from 'lodash'

export function extendsConfig(config: GeneratorConfig, newConfig: Partial<GeneratorConfig>): GeneratorConfig {
  const mergedConfig = cloneDeep(config)

  return mergeWith(mergedConfig, newConfig, (newValue, srcValue, key) => {
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

export function prepareConfig(config: GeneratorConfig): GeneratorConfig {
  let newConfig = cloneDeep(config)

  const plugins = newConfig.plugins || []

  for (const plugin of plugins) {
    if (plugin.extends) {
      const pluginExtendsConfig = typeof plugin.extends === 'function' ? plugin.extends(newConfig) : plugin.extends
      newConfig = extendsConfig(newConfig, pluginExtendsConfig)
    }
  }

  return newConfig
}

export default prepareConfig
