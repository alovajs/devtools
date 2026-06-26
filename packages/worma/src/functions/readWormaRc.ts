import type { ApiPlugin, Config, GeneratorConfig } from '@/helper/config/type'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PresetTemplateName } from '@/constant'
import { logger } from '@/helper/logger'
import { alovaGlobals, axios, fetch, ky, alova as templateAlova } from '@/template'

/**
 * .wormarc configuration line parsed result
 */
interface WormaRcLine {
  /** Custom output folder name (key part before =) */
  outputKey?: string
  /** OpenAPI URL */
  url: string
  /** Template type (alova, axios, fetch, ky) */
  template?: keyof typeof PRESET_TEMPLATES
}

/**
 * Parse a single line from .wormarc file
 *
 * Supported formats:
 * - `https://xxxx.com/openapi.json` -> generates in src/api, default alova template
 * - `https://yyyy.com/openapi.json, axios` -> generates in src/api2, axios template
 * - `myApi=https://zzzz.com/openapi.json` -> generates in src/myApi, default alova template
 * - `myApi=https://zzzz.com/openapi.json, fetch` -> generates in src/myApi, fetch template
 */
function parseLine(line: string): WormaRcLine | null {
  line = line.trim()
  if (!line) {
    return null
  }

  // Lines starting with # are full-line comments
  if (line.startsWith('#')) {
    return null
  }

  // Strip inline comments: ` //` (space before //) to avoid matching // in URLs
  const inlineCommentIndex = line.indexOf(' //')
  if (inlineCommentIndex !== -1) {
    line = line.substring(0, inlineCommentIndex).trim()
  }

  if (!line) {
    return null
  }

  let outputKey: string | undefined
  let url: string
  let template: string | undefined

  // Check for key=value format
  const equalIndex = line.indexOf('=')
  if (equalIndex !== -1) {
    outputKey = line.substring(0, equalIndex).trim()
    line = line.substring(equalIndex + 1).trim()
  }

  // Split by comma to get URL and template
  const commaIndex = line.indexOf(',')
  if (commaIndex !== -1) {
    url = line.substring(0, commaIndex).trim()
    template = line.substring(commaIndex + 1).trim() || undefined
  }
  else {
    url = line.trim()
  }

  if (!url) {
    return null
  }

  return {
    outputKey,
    url,
    template: template as WormaRcLine['template'],
  }
}

/**
 * Template type mapping to plugin factories
 */
const PRESET_TEMPLATES: Record<string, () => ApiPlugin> = {
  alova: templateAlova,
  alovaGlobals,
  axios,
  fetch,
  ky,
}

/**
 * Read and parse .wormarc file
 *
 * File format:
 * ```bash
 * # Comment lines start with #
 * https://xxxx.com/openapi.json
 * https://yyyy.com/openapi.json, axios
 * myApi=https://zzzz.com/openapi.json, fetch
 * ```
 *
 * @param projectPath The project path where .wormarc file is located
 * @returns Parsed configuration or null if file doesn't exist
 */
export async function readWormaRc(projectPath: string): Promise<Config | null> {
  const rcPath = path.join(projectPath, '.wormarc')

  try {
    const content = await fs.readFile(rcPath, 'utf-8')
    const lines = content.split('\n')
    const generators: GeneratorConfig[] = []
    let defaultIndex = 1

    for (const line of lines) {
      const parsed = parseLine(line)
      if (!parsed) {
        continue
      }

      const { outputKey, url, template = PresetTemplateName.ALOVA } = parsed

      // Determine output folder
      let output: string
      if (outputKey) {
        // If outputKey contains `/`, use it as-is (already a path)
        output = outputKey.includes('/') ? outputKey : `src/${outputKey}`
      }
      else {
        // Default folder is src/api, src/api2, etc.
        output = defaultIndex === 1 ? 'src/api' : `src/api${defaultIndex}`
        defaultIndex++
      }

      // Set template if specified
      if (!template || !PRESET_TEMPLATES[template]) {
        throw logger.throwError(
          `Invalid template: ${template}. Available templates: ${Object.keys(PRESET_TEMPLATES).join(', ')}`,
        )
      }
      // Build generator config
      const generatorConfig: GeneratorConfig = {
        input: url,
        output,
        plugins: [PRESET_TEMPLATES[template]()],
      }

      generators.push(generatorConfig)
    }

    if (generators.length === 0) {
      return null
    }

    return {
      generator: generators,
    }
  }
  catch (error) {
    // File doesn't exist or can't be read
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    logger.warn('Failed to read .wormarc file:', error)
    return null
  }
}

/**
 * Check if .wormarc file exists
 */
export async function hasWormaRc(projectPath: string): Promise<boolean> {
  const rcPath = path.join(projectPath, '.wormarc')
  try {
    await fs.access(rcPath)
    return true
  }
  catch {
    return false
  }
}
