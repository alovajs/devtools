import type { ApiPlugin, TemplateData } from '@/type'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { PluginName, PresetTemplateName } from '@/constant'
import { logger } from '@/helper/logger'
import { getPresetTemplatePath } from '@/template'

const nodeRequire = createRequire(__filename)

/**
 * Coding agents that the generated skill can be installed into.
 *
 * The `skills` package (`https://www.npmjs.com/package/skills`) is CLI-only and
 * ships no TypeScript types, so this union mirrors the agent names it supports
 * (its documented "supported agents" list). The transitive `@vercel/detect-agent`
 * package does export a `KnownAgentNames` type, but it only covers a small subset
 * of agents (e.g. it is missing `claude-code` and `windsurf`), so it cannot be
 * reused directly here.
 */
export type SkillAgent
  = | 'aider-desk'
    | 'amp'
    | 'antigravity'
    | 'antigravity-cli'
    | 'astrbot'
    | 'augment'
    | 'autohand-code'
    | 'bob'
    | 'claude-code'
    | 'cline'
    | 'codearts-agent'
    | 'codebuddy'
    | 'codemaker'
    | 'codestudio'
    | 'codex'
    | 'command-code'
    | 'continue'
    | 'cortex'
    | 'crush'
    | 'cursor'
    | 'deepagents'
    | 'devin'
    | 'dexto'
    | 'droid'
    | 'eve'
    | 'firebender'
    | 'forgecode'
    | 'gemini-cli'
    | 'github-copilot'
    | 'goose'
    | 'hermes-agent'
    | 'iflow-cli'
    | 'inference-sh'
    | 'jazz'
    | 'junie'
    | 'kilo'
    | 'kiro-cli'
    | 'kimi-code-cli'
    | 'kode'
    | 'lingma'
    | 'loaf'
    | 'mcpjam'
    | 'mistral-vibe'
    | 'moxby'
    | 'mux'
    | 'ona'
    | 'opencode'
    | 'openhands'
    | 'openclaw'
    | 'pi'
    | 'pochi'
    | 'promptscript'
    | 'qoder'
    | 'qoder-cn'
    | 'qwen-code'
    | 'reasonix'
    | 'replit'
    | 'rovodev'
    | 'roo'
    | 'tabnine-cli'
    | 'terramind'
    | 'tinycloud'
    | 'trae'
    | 'trae-cn'
    | 'universal'
    | 'warp'
    | 'windsurf'
    | 'zed'
    | 'zencoder'
    | 'zenflow'
    | 'neovate'
    | 'adal'

export interface AiDocConfig {
  template?: string
  outputDir?: string
  /**
   * Name written into the generated skill's `SKILL.md` frontmatter. This is the
   * name the skill is installed/referenced under. When omitted, the skill keeps
   * its default name derived from the API title: `apis-<title>`.
   */
  skillName?: string
  /**
   * Which coding agent(s) to install the generated skill into.
   * - omitted: do NOT install the skill.
   * - `SkillAgent` / `SkillAgent[]`: install to the given agent(s) directly.
   * - `string`: comma (English or Chinese) separated agent names, used directly
   *   as the target agent(s), e.g. `"cursor"` or `"cursor, claude-code"`.
   *   This is handy when the agent list comes from a config file parsed via
   *   `parseAgentFile`, e.g. `aiDoc({ agent: parseAgentFile('.myrc').agent })`.
   */
  agent?: SkillAgent | (SkillAgent | (string & {}))[] | (string & {})
}

const prefix = '[plugin: aiDoc]'

export function aiDoc(config?: AiDocConfig): ApiPlugin {
  const outputDirName = config?.outputDir ?? 'aidocs'
  const customTemplatePath = config?.template
  const agentValue = config?.agent

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

      // Skill name written into SKILL.md frontmatter. Defaults to `apis-<title>`
      // which is the historical name the generated skill used before this option existed.
      const skillName = config?.skillName ?? `apis-${templateData.title ?? ''}`

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
            ...(isGlobals ? {} : { fileLocation: `${outputRel.replace(/\\/g, '/')}/${group.tag}` }),
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
          skillName,
        } as TemplateData,
      })

      if (agentValue) {
        const agentsToInstall = resolveInstallAgents(agentValue)
        for (const agent of agentsToInstall) {
          installSkill(aidocsDir, agent, projectPath)
        }
      }
    },
  }
}

/**
 * Resolve the list of coding agents to install the generated skill into.
 *
 * @param agent the raw `agent` config value
 *  - `SkillAgent` / `SkillAgent[]`: used directly as the target agent(s).
 *  - `string`: parsed as a comma (English or Chinese) separated agent list,
 *    e.g. `"cursor"` or `"cursor, claude-code"`.
 *
 * The agent list is no longer read from `node_modules/.worma/skills.local`.
 * Instead, callers pass the agent(s) explicitly via the `agent`
 * option (optionally sourced from their own config file via `parseAgentFile`).
 */
function resolveInstallAgents(agent: NonNullable<AiDocConfig['agent']>): string[] {
  const raw = Array.isArray(agent) ? agent.join(',') : agent
  return parseAgentList(raw)
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

/**
 * Parse a `key=value` configuration file (same format as an environment file).
 *
 * Lines starting with `#` are treated as comments and ignored; blank lines and
 * lines without `=` are skipped. Surrounding single/double quotes around values
 * are stripped. Returns a map of keys to their (string) values.
 *
 * When `filePath` is omitted, the file is read from `.wormaagent.local` in the
 * current working directory (project root).
 *
 * This makes it easy to keep the target coding agent(s) in a config file and
 * feed them into the `agent` option:
 *
 * @example
 * ```ts
 * // .wormaagent.local  ->  agent=cursor, claude-code
 * const cfg = parseAgentFile() // reads ./.wormaagent.local by default
 * aiDoc({ agent: cfg.agent })
 * ```
 */
export function parseAgentFile(filePath?: string): Record<string, string> {
  const target = filePath ?? path.resolve(process.cwd(), '.wormaagent.local')
  const content = fs.readFileSync(target, 'utf-8')
  const result: Record<string, string> = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue
    }

    const eqIndex = trimmed.indexOf('=')
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()

    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1)
    }

    if (key)
      result[key] = value
  }
  return result
}

export default aiDoc
