import type { GeneratorConfig } from '@/type'
import { extendsConfig } from '@/functions/prepareConfig'

/**
 * Extends the generator configuration:
 * merges the provided newConfig (object or function) with the base config to produce the merged config.
 * When newConfig is not provided, falls back to the original config.
 * @param config base configuration
 * @param newConfig config to merge, or a function that produces the merged config
 * @returns the merged and normalized configuration
 */
export function extend(config: GeneratorConfig, newConfig?: Partial<GeneratorConfig> | ((config: GeneratorConfig) => Partial<GeneratorConfig>)) {
  // Compute the extension config based on newConfig's type: call it if it's a function,
  // otherwise use it directly; fall back to the original config if not provided
  const pluginExtendsConfig = typeof newConfig === 'function' ? newConfig(config) : (newConfig ?? config)
  // Use extendsConfig to merge and normalize, ensuring the final structure meets the generator's requirements
  return extendsConfig(config, pluginExtendsConfig)
}

/**
 * Tests if value matches the specified rule
 */
export function isMatch(
  value: string,
  match?: string | RegExp | ((key: string, level?: number) => boolean),
  level = 0,
): boolean {
  if (!match)
    return true

  if (typeof match === 'string') {
    return value.includes(match)
  }

  if (match instanceof RegExp) {
    return match.test(value)
  }

  if (typeof match === 'function') {
    return match(value, level)
  }

  return false
}
