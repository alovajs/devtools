import type { ApiPlugin, TemplateData } from '@/type'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { PluginName, PresetTemplateName } from '@/constant'
import { logger } from '@/helper/logger'
import { getPresetTemplatePath } from '@/template'

const nodeRequire = createRequire(__filename)

export interface AiDocConfig {
  template?: string
  outputDir?: string
  installSkill?: boolean
}

const SKILLS_SUPPORTED_AGENTS_URL = 'https://www.npmjs.com/package/skills#supported-agents'

const prefix = '[plugin: aiDoc]'

export function aiDoc(config?: AiDocConfig): ApiPlugin {
  const outputDirName = config?.outputDir ?? 'aidocs'
  const customTemplatePath = config?.template
  const installSkillEnabled = config?.installSkill ?? false

  let capturedOutput = ''
  let capturedServerName = ''

  return {
    name: PluginName.AI_DOC,
    config({ config: generatorConfig }) {
      capturedOutput = generatorConfig.output ?? ''
      capturedServerName = generatorConfig.serverName ?? ''
      return generatorConfig
    },
    async codeGenerated({ error, data: templateData, projectPath, outputDir, renderTemplate }) {
      if (error)
        return

      if (!templateData)
        return

      const outputBase = outputDir || path.resolve(projectPath, capturedOutput)
      const aidocsDir = path.resolve(outputBase, outputDirName)

      const templatePath = customTemplatePath
        ? (path.isAbsolute(customTemplatePath) ? customTemplatePath : path.resolve(projectPath, customTemplatePath))
        : getPresetTemplatePath(PresetTemplateName.AI_DOC)

      const serverName = capturedServerName || templateData.title || 'API'

      // Compute file location for each API (relative path from project root to generated file)
      // Skip fileLocation for alova-globals since APIs are called globally, not from a specific file
      const isGlobals = templateData.config?.templateName === 'alova-globals'
      const outputRel = path.relative(projectPath, outputBase)
      const enrichedData: TemplateData = {
        ...templateData,
        allApis: templateData.allApis.map(api => ({
          ...api,
          // Store the generated file location where this API's code lives
          ...(isGlobals ? {} : { fileLocation: `${outputRel.replace(/\\/g, '/')}/${api.tag}` }),
        })),
        tagedApis: templateData.tagedApis.map(group => ({
          ...group,
          apis: group.apis.map(api => ({
            ...api,
            ...(isGlobals ? {} : { fileLocation: `${outputRel.replace(/\\/g, '/')}/${group.tagName}` }),
          })),
        })),
      }

      await renderTemplate?.({
        templatePath,
        type: templateData.type,
        outputDir: aidocsDir,
        data: {
          ...enrichedData,
          serverName,
        } as TemplateData,
      })

      if (installSkillEnabled) {
        const { agents } = resolveAgents(projectPath)
        for (const agent of agents) {
          installSkill(aidocsDir, agent, projectPath)
        }
      }
    },
  }
}

/**
 * Resolve the target coding agents from `.env.local` in the project root.
 *
 * Multiple agents can be configured as a comma-separated list, e.g.
 * `agent=cursor, claude-code, windsurf`. Both commas and surrounding
 * whitespace are tolerated.
 *
 * If the file does not exist, it will be created and `.gitignore` will be
 * updated to ignore `*.local` files. An error is then thrown asking the user
 * to set `agent=<coding-agent>` (optionally multiple, comma-separated).
 *
 * If `agent` is missing or empty, an error is thrown with guidance.
 */
function resolveAgents(projectPath: string): { agents: string[] } {
  const envFilePath = path.join(projectPath, '.env.local')

  if (!fs.existsSync(envFilePath)) {
    createEnvLocalFile(envFilePath)
    ensureGitIgnoreLocal(projectPath)
    throw logger.throwError(
      `${prefix}Created .env.local at project root. Please set the coding agent you are using, e.g. agent=cursor or multiple agents comma-separated: agent=cursor,claude-code. Supported agents list: ${SKILLS_SUPPORTED_AGENTS_URL}`,
    )
  }

  const content = fs.readFileSync(envFilePath, 'utf-8')
  const raw = parseEnvValue(content, 'agent') ?? ''
  const agents = parseAgentList(raw)

  if (agents.length === 0) {
    throw logger.throwError(
      `${prefix}Missing "agent" in .env.local at project root. Please set the coding agent you are using, e.g. agent=cursor or multiple agents comma-separated: agent=cursor,claude-code. Supported agents list: ${SKILLS_SUPPORTED_AGENTS_URL}`,
    )
  }

  return { agents }
}

/**
 * Parse an agent string into a deduplicated list of trimmed agent names.
 *
 * Agents may be separated by either an English comma (`,`) or a Chinese
 * comma (`，`), with any amount of whitespace (including none) allowed on
 * either side. Empty entries are ignored.
 */
export function parseAgentList(raw: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const part of raw.split(/[,，]/)) {
    const agent = part.trim()
    if (!agent || seen.has(agent))
      continue
    seen.add(agent)
    result.push(agent)
  }
  return result
}

/**
 * Resolve the absolute path to the `skills` CLI installed alongside this package.
 */
function resolveSkillsCli(): string {
  try {
    const skillsPkgPath = nodeRequire.resolve('skills/package.json')
    return path.join(path.dirname(skillsPkgPath), 'bin', 'cli.mjs')
  }
  catch {
    throw logger.throwError(
      'Could not resolve the "skills" CLI. Make sure "skills" is installed as a dependency of @alova/worma.',
    )
  }
}

/**
 * Install the generated skill into the configured coding agent using the
 * `skills` CLI.
 */
function installSkill(skillPath: string, agent: string, projectPath: string) {
  // Normalize to forward slashes so the shell command works across platforms
  const resolvedSkillPath = path.resolve(skillPath).replace(/\\/g, '/')
  const skillsCli = resolveSkillsCli()

  try {
    execSync(`node "${skillsCli}" add "${resolvedSkillPath}" -a "${agent}" -y`, {
      cwd: projectPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    })
  }
  catch (error: any) {
    console.error(`${prefix}Failed to install skill to "${agent}". Make sure the skill is valid and the target agent is supported.`, error.stack)
    throw logger.throwError(error)
  }
}

function createEnvLocalFile(envFilePath: string) {
  const content = `# Worma aiDoc skill installer configuration
# Please set the coding agent(s) you are using (e.g. cursor, claude-code, windsurf).
# You can configure multiple agents comma-separated, e.g. agent=cursor,claude-code.
# Supported agents list: ${SKILLS_SUPPORTED_AGENTS_URL}
agent=
`
  fs.writeFileSync(envFilePath, content, 'utf-8')
}

function ensureGitIgnoreLocal(projectPath: string) {
  const gitignorePath = path.join(projectPath, '.gitignore')
  const pattern = '*.local'
  let content = ''

  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8')
    const lines = content.split(/\r?\n/)
    if (lines.some(line => line.trim() === pattern || line.trim() === '*.local/')) {
      return
    }
  }

  const prefix = content === '' || content.endsWith('\n') ? '' : '\n'
  fs.writeFileSync(gitignorePath, `${content}${prefix}${pattern}\n`, 'utf-8')
}

function parseEnvValue(content: string, key: string): string | undefined {
  const lines = content.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const eqIndex = trimmed.indexOf('=')
    const k = trimmed.slice(0, eqIndex).trim()
    let v = trimmed.slice(eqIndex + 1).trim()

    // Remove surrounding quotes if present
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('\'') && v.endsWith('\''))) {
      v = v.slice(1, -1)
    }

    if (k === key) {
      return v
    }
  }
  return undefined
}

export default aiDoc
