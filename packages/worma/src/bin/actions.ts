import path from 'node:path'
import * as readline from 'node:readline/promises'
import type { Config, GeneratorConfig } from '@/type/lib'
import type { TemplatePreset } from '@/createConfig'
import type { TemplateType } from '@/type/lib'
import { createConfig, readConfig, resolveWorkspaces } from '@/index'
import generate from '@/generate'
import { resolveConfigFile, existsPromise } from '@/utils'
import getAutoTemplateType from '@/functions/getAutoTemplateType'
import { PresetTemplateName, TemplateTypeEnum } from '@/constant'
import { InitRenderer, INIT_TEMPLATE_CHOICES, MultiGeneratorRenderer, MultiProjectRenderer } from './renderer'
import { theme } from './theme'
import type { ProjectInfo } from './renderer'

// eslint-disable-next-line ts/no-require-imports
const pkg = require('../../package.json')

export async function actionInit({ type, template, project }: { type?: TemplateType, template?: TemplatePreset, project?: string }) {
  const renderer = new InitRenderer(pkg.version)

  // Resolve project path
  const projectPath = project
    ? (path.isAbsolute(project) ? project : path.resolve(process.cwd(), project))
    : process.cwd()

  // Auto-detect type if not specified
  const isAutoDetected = !type
  const resolvedType = type || await getAutoTemplateType(projectPath)

  // Determine config filename
  const ext = resolvedType === TemplateTypeEnum.TYPESCRIPT ? 'ts' : 'js'
  const configFilename = `worma.config.${ext}`
  const outputPath = path.join(projectPath, configFilename)
  const isTTY = process.stdout.isTTY

  // ── Phase 1: Pre-flight ──
  renderer.printHeader()
  renderer.printProjectInfo(projectPath, resolvedType, isAutoDetected)

  // ── Overwrite check (BEFORE template selection) ──
  if (await existsPromise(outputPath)) {
    if (isTTY) {
      renderer.printSeparator()
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      const answer = await rl.question(`  ${theme.warning('?')} ${configFilename} already exists. Overwrite? (y/N) `)
      rl.close()
      if (answer.toLowerCase() !== 'y') {
        renderer.printSeparator()
        renderer.printSkipped(outputPath)
        return
      }
    }
    else {
      // Non-TTY: silently skip
      renderer.printSeparator()
      renderer.printSkipped(outputPath)
      return
    }
  }

  // ── Template selection ──
  let resolvedTemplate = template
  if (!resolvedTemplate) {
    if (isTTY) {
      resolvedTemplate = await promptTemplate()
    }
    else {
      // Non-TTY (tests / CI / pipe): default to alova
      resolvedTemplate = PresetTemplateName.ALOVA
    }
  }

  // Show final config info (template + output)
  renderer.printConfigInfo(resolvedTemplate, outputPath)
  renderer.printSeparator()

  // ── Generate config file ──
  try {
    await createConfig({ type: resolvedType, template: resolvedTemplate, projectPath })
    renderer.printSuccess()
  }
  catch (error: any) {
    renderer.printFailure(`Configuration initialization failed: ${error.message}`)
    process.exit(1)
  }
}

/** Interactive template preset selection (TTY only). */
async function promptTemplate(): Promise<TemplatePreset> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log('')
  console.log(`    ${theme.label('Select template preset:')}`)
  for (let i = 0; i < INIT_TEMPLATE_CHOICES.length; i++) {
    const choice = INIT_TEMPLATE_CHOICES[i]
    const marker = i === 0 ? `  ${theme.dim('(default)')}` : ''
    console.log(`      ${i + 1}. ${choice.name}${marker}`)
  }

  const answer = await rl.question(`    ${theme.dim('▸')} `)
  rl.close()

  const num = Number(answer)
  if (num >= 1 && num <= INIT_TEMPLATE_CHOICES.length) {
    return INIT_TEMPLATE_CHOICES[num - 1].value
  }
  // Default to first choice (alova) on invalid input
  return INIT_TEMPLATE_CHOICES[0].value
}

/** Internal project entry used during config collection. */
interface ProjectEntry {
  dir: string
  configPath: string
  config: Config
  generators: GeneratorConfig[]
}

export async function actionGen({
  project,
  force,
}: {
  project?: string
  force?: boolean
}) {
  // 1. Resolve project directories
  const projectDirs = project ? [project] : await resolveWorkspaces()
  if (projectDirs.length === 0) {
    console.error('No workspaces found.')
    process.exit(1)
  }

  // 2. Collect project entries (dir, configPath, config, generators)
  const projects: ProjectEntry[] = []
  for (const dir of projectDirs) {
    let configPath: string | undefined
    try {
      configPath = (await resolveConfigFile(dir)) ?? undefined
    }
    catch {
      // config file not found — readConfig will throw a better error below
    }

    const config = await readConfig(dir)
    const generators = config.generator

    if (!generators || generators.length === 0) {
      console.log(`No generators configured for \`${dir}\`.`)
      continue
    }

    projects.push({ dir, configPath: configPath ?? dir, config, generators })
  }

  if (projects.length === 0) return

  // 3. Branch routing
  if (projects.length === 1) {
    // Single project: existing MultiGeneratorRenderer path — 100% unchanged behaviour
    const proj = projects[0]
    await generateForProject(proj, force)
  }
  else {
    // Multi-project: new MultiProjectRenderer + Promise.all for parallel execution
    const projectInfos: ProjectInfo[] = projects.map(p => ({
      dir: p.dir,
      configPath: p.configPath,
      generators: p.generators,
    }))
    const renderer = new MultiProjectRenderer(projectInfos, pkg.version)

    const allResults = await Promise.all(
      projects.map((proj, pi) =>
        generate(proj.config, {
          force,
          projectPath: proj.dir,
          onProgress(event) {
            renderer.onProjectEvent(pi, event)
          },
        }),
      ),
    )

    renderer.finalize(allResults)
  }
}

async function generateForProject(entry: ProjectEntry, force?: boolean): Promise<void> {
  const { dir, configPath, config, generators } = entry

  // Initialize renderer — prints pre-flight (Phase 1), starts live-update (Phase 2)
  const renderer = new MultiGeneratorRenderer(
    generators,
    pkg.version,
    configPath,
  )

  // Mark all generators active
  for (let i = 0; i < generators.length; i++) {
    renderer.setActive(i)
  }

  // Unified entry — generate() creates per-gen trackers internally
  const results = await generate(config, {
    force,
    projectPath: dir,
    onProgress(event) {
      switch (event.phase) {
        case 'active':
          renderer.setActive(event.index)
          break
        case 'progress':
          renderer.setProgress(event.index, event.progress, event.message)
          break
        case 'done':
          renderer.setDone(event.index, event.resolvedInput)
          break
        case 'skipped':
          renderer.setSkipped(event.index, event.resolvedInput)
          break
        case 'failed':
          renderer.setFailed(event.index, event.error)
          break
      }
    },
  })

  // Finalize — Phase 3: stop live-update, show concise ✔/✖ summary
  const failedCount = results.filter(r => !r).length
  renderer.finalize(failedCount)
}
