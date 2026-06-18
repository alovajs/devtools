import type { Config, GenerateApiOptions } from '@/type/lib'
import { configHelper, ProgressTracker } from '@/helper'
/**
 * Generate relevant API information based on the configuration object. Generally, it needs to be used with `readConfig()`.
 * @param config generating config
 * @param options config rules that contains `force`, `projectPath`, `onProgress`, `progressInterval`
 * @returns An array that contains the result of `generator` items in configuration whether generation is successful.
 */
async function generate(config: Config, options?: GenerateApiOptions) {
  if (!config) {
    return [] as boolean[]
  }
  const tracker = new ProgressTracker(options?.onProgress, options?.progressInterval ?? 500)
  tracker.start()
  try {
    await configHelper.load(config, options?.projectPath ?? process.cwd(), tracker)
    return configHelper.generate({
      force: options?.force,
      tracker,
    })
  }
  finally {
    tracker.stop()
  }
}
export default generate
