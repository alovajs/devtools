import type { Config, GeneratorConfig, TemplateConfig } from '@/helper/config/type'
import fs from 'node:fs/promises'
import path from 'node:path'
import { logger } from '@/helper/logger'
import { alovaFunctional, alovaGlobals, axios, fetch, ky } from '@/template'

/**
 * .alovarc configuration line parsed result
 */
interface AlovaRcLine {
  /** Custom output folder name (key part before =) */
  outputKey?: string
  /** OpenAPI URL */
  url: string
  /** Template type (alova, axios, fetch, ky) */
  template?: string
}

/**
 * Parse a single line from .alovarc file
 *
 * Supported formats:
 * - `https://xxxx.com/openapi.json` -> generates in src/api, default alova template
 * - `https://yyyy.com/openapi.json, axios` -> generates in src/api2, axios template
 * - `myApi=https://zzzz.com/openapi.json` -> generates in src/myApi, default alova template
 * - `myApi=https://zzzz.com/openapi.json, fetch` -> generates in src/myApi, fetch template
 */
function parseLine(line: string): AlovaRcLine | null {
  // Remove comments
  const commentIndex = line.indexOf('#')
  if (commentIndex !== -1) {
    line = line.substring(0, commentIndex)
  }

  line = line.trim()
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
    template,
  }
}

/**
 * Template type mapping to template config functions
 */
const TEMPLATE_MAP: Record<string, TemplateConfig> = {
  alovaGlobals: alovaGlobals(),
  alovaFunctional: alovaFunctional(),
  axios: axios(),
  fetch: fetch(),
  ky: ky(),
}

/**
 * Read and parse .alovarc file
 *
 * File format:
 * ```bash
 * # Comment lines start with #
 * https://xxxx.com/openapi.json
 * https://yyyy.com/openapi.json, axios
 * myApi=https://zzzz.com/openapi.json, fetch
 * ```
 *
 * @param projectPath The project path where .alovarc file is located
 * @returns Parsed configuration or null if file doesn't exist
 */
export async function readAlovaRc(projectPath: string): Promise<Config | null> {
  const rcPath = path.join(projectPath, '.alovarc')

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

      const { outputKey, url, template = 'functional' } = parsed

      // Determine output folder
      let output: string
      if (outputKey) {
        output = path.join('src', outputKey)
      }
      else {
        // Default folder is src/api, src/api2, etc.
        output = defaultIndex === 1 ? 'src/api' : `src/api${defaultIndex}`
        defaultIndex++
      }

      // Set template if specified
      if (!template || !TEMPLATE_MAP[template]) {
        throw logger.throwError(
          `Invalid template: ${template}. Available templates: ${Object.keys(TEMPLATE_MAP).join(', ')}`,
        )
      }
      // Build generator config
      const generatorConfig: GeneratorConfig = {
        input: url,
        output,
        template: TEMPLATE_MAP[template],
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
    logger.warn('Failed to read .alovarc file:', error)
    return null
  }
}

/**
 * Check if .alovarc file exists
 */
export async function hasAlovaRc(projectPath: string): Promise<boolean> {
  const rcPath = path.join(projectPath, '.alovarc')
  try {
    await fs.access(rcPath)
    return true
  }
  catch {
    return false
  }
}
