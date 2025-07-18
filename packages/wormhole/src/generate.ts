import type { Config, GenerateApiOptions } from '@/type/lib'
import { configHelper } from '@/helper'
/**
 * Generate relevant API information based on the configuration object. Generally, it needs to be used with `readConfig()`.
 * @param config generating config
 * @param rules config rules that contains `force`, `projectPath`
 * @returns An array that contains the result of `generator` items in configuration whether generation is successful.
 */
async function generate(config: Config, rules?: GenerateApiOptions) {
  if (!config) {
    return [] as boolean[]
  }
  await configHelper.load(config, rules?.projectPath ?? process.cwd())
  return configHelper.generate({
    force: rules?.force,
  })
}
export default generate
