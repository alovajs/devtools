import type { Config, GenerateApiOptions, GeneratorProgressEvent } from '@/type/lib'
import { PoolManager } from '@/core/workerPool/poolManager'
import { ConfigHelper, logger, TemplateHelper } from '@/helper'
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
  if (!config)
    return []

  const projectPath = options?.projectPath ?? process.cwd()
  const emit = options?.onProgress

  // Each generate() call creates its own ConfigHelper / ConfigManager,
  // so multiple concurrent calls never share mutable config state.
  const helper = new ConfigHelper()
  await helper.load(config, projectPath)
  const generators = helper.getConfig().generator

  // Run all generators in parallel, each with its own ProgressTracker
  const results = await Promise.all(
    generators.map(async (gen, i) => {
      const generatorName = gen.input || `generator-${i}`
      logger.debug(`Generator [${i}] starting`, { name: generatorName, input: gen.input, output: gen.output })
      emit?.({ index: i, phase: 'active' } as GeneratorProgressEvent)

      const tracker = new ProgressTracker((snapshot) => {
        if (!emit)
          return
        for (const [source, entry] of Object.entries(snapshot)) {
          emit({
            index: i,
            phase: 'progress',
            progress: entry.progress,
            message: entry.message || '',
            source,
          })
        }
      }, 16) // 16ms throttle (~60fps), avoids flooding the event loop on high-frequency updates

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
        logger.debug(`Generator [${i}] finished`, {
          name: generatorName,
          success: result.success,
          resolvedInput: result.resolvedInput,
        })
        return result.success
      }
      catch (error: any) {
        logger.debug(`Generator [${i}] failed`, {
          name: generatorName,
          error: error.message,
          stack: error.stack,
        })
        emit?.({ index: i, phase: 'failed', error: error.message } as GeneratorProgressEvent)
        return false
      }
      finally {
        tracker.stop()
      }
    }),
  )

  logger.debug('Flushing template data cache', { projectPath })
  await TemplateHelper.flushAllData(projectPath)
  PoolManager.getInstance().releaseAll()
  logger.debug('Generation complete', { results })
  return results
}

export default generate
