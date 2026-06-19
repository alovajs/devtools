import type { Config, GenerateApiOptions, GeneratorProgressEvent } from '@/type/lib'
import { configHelper, TemplateHelper } from '@/helper'
import { GeneratorHelper } from '@/helper/config/GeneratorHelper'
import { ProgressTracker } from '@/helper/progress'

/**
 * Generate relevant API information based on the configuration object.
 *
 * When `options.onProgress` is provided, each generator independently reports
 * its lifecycle via {@link GeneratorProgressEvent} discriminated union events.
 *
 * @param config generating config
 * @param options config rules that contains `force`, `projectPath`, `onProgress`
 * @returns An array that contains the result of `generator` items in configuration whether generation is successful.
 */
async function generate(config: Config, options?: GenerateApiOptions): Promise<boolean[]> {
  if (!config) return []

  const projectPath = options?.projectPath ?? process.cwd()
  const emit = options?.onProgress

  // Load phase (shared, no per-gen events during load) — plugins may modify generator configs
  await configHelper.load(config, projectPath)
  // Use the processed generators from ConfigManager (after plugin hooks have run)
  const generators = configHelper.getConfig().generator

  // Run all generators in parallel, each with its own ProgressTracker
  const results = await Promise.all(
    generators.map(async (gen, i) => {
      emit?.({ index: i, phase: 'active' } as GeneratorProgressEvent)

      const tracker = new ProgressTracker((snapshot) => {
        if (!emit) return
        for (const [source, entry] of Object.entries(snapshot)) {
          emit({
            index: i,
            phase: 'progress',
            progress: entry.progress,
            message: entry.message || '',
            source,
          })
        }
      }, 0) // interval 0 → flush immediately on every update()

      tracker.start()

      try {
        const result = await GeneratorHelper.generate(gen, {
          force: options?.force,
          projectPath,
          tracker,
        })
        emit?.({
          index: i,
          phase: result.success ? 'done' : 'skipped',
          resolvedInput: result.resolvedInput,
        } as GeneratorProgressEvent)
        return result.success
      }
      catch (error: any) {
        emit?.({ index: i, phase: 'failed', error: error.message } as GeneratorProgressEvent)
        return false
      }
      finally {
        tracker.stop()
      }
    }),
  )

  await TemplateHelper.flushAllData(projectPath)
  return results
}

export default generate
