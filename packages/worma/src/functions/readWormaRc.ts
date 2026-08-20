import type { ApiPlugin, Config, GeneratorConfig } from '@/helper/config/type'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PresetTemplateName } from '@/constant'
import { logger } from '@/helper/logger'
import { aiDoc } from '@/plugins'
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
  /**
   * Coding agent(s) to install the generated AI skill into. Comma (English or
   * Chinese) separated. Optional: when omitted, the `aiDoc` plugin is NOT added,
   * so no AI skill document is generated or installed for this line.
   */
  agent?: string
}

/**
 * Parse a single line from .wormarc file
 *
 * Supported formats:
 * - `https://xxxx.com/openapi.json` -> generates in src/api, default alova template, no aiDoc plugin
 * - `https://yyyy.com/openapi.json, axios` -> generates in src/api2, axios template, no aiDoc plugin
 * - `myApi=https://zzzz.com/openapi.json, fetch` -> generates in src/myApi, fetch template, no aiDoc plugin
 * - `https://xxxx.com/openapi.json, alova, cursor` -> alova template, aiDoc installed to `cursor`
 * - `myApi=https://zzzz.com/openapi.json, fetch, cursor, claude-code` -> fetch template, aiDoc installed to both agents
 *
 * The optional third comma-separated segment is the `agent` list for the `aiDoc`
 * plugin. When it is absent, the `aiDoc` plugin is skipped entirely for that line.
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

  // Check for key=value format
  const equalIndex = line.indexOf('=')
  if (equalIndex !== -1) {
    outputKey = line.substring(0, equalIndex).trim()
    line = line.substring(equalIndex + 1).trim()
  }

  // Split by comma into at most three segments: url[, template][, agent]
  const segments = line.split(',').map(s => s.trim()).filter(s => s !== '')
  const url = segments[0] ?? ''
  const template = segments[1]
  const agent = segments[2]

  if (!url) {
    return null
  }

  return {
    outputKey,
    url,
    template: template as WormaRcLine['template'],
    agent,
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

      const { outputKey, url, template = PresetTemplateName.ALOVA, agent } = parsed

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

      // Build plugin list. The aiDoc plugin is only added when an agent is
      // explicitly specified on the line; otherwise no AI skill doc is generated
      // or installed for this entry.
      const plugins: ApiPlugin[] = [PRESET_TEMPLATES[template]()]
      if (agent) {
        plugins.push(aiDoc({ agent }))
      }

      // Build generator config
      const generatorConfig: GeneratorConfig = {
        input: url,
        output,
        plugins,
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
