/* eslint-disable no-console */
import type { ProjectInfo } from './renderer'
import type { TemplatePreset } from '@/createConfig'
import type { ChangeLevel, ChangeOp, SourceChange } from '@/functions/diffDocument'
import type { Config, GeneratorConfig, RecordedChangeInfo, TemplateType } from '@/type/lib'
import path from 'node:path'
import * as readline from 'node:readline/promises'
import { setGlobalConfig } from '@/config'
import { PresetTemplateName, TemplateTypeEnum } from '@/constant'
import getAutoTemplateType from '@/functions/getAutoTemplateType'
import generate from '@/generate'
import { logger } from '@/helper'
import { createConfig, readConfig, resolveWorkspaces } from '@/index'
import { existsPromise, resolveConfigFile } from '@/utils'

import { INIT_TEMPLATE_CHOICES, InitRenderer, MultiGeneratorRenderer, MultiProjectRenderer } from './renderer'
import { theme } from './theme'
// eslint-disable-next-line ts/no-require-imports, perfectionist/sort-imports
const pkg = require('../../package.json')

// eslint-disable-next-line ts/no-require-imports, perfectionist/sort-imports
const Table: any = require('cli-table3')

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
  debug,
}: {
  project?: string
  debug?: boolean
}) {
  if (debug) {
    logger.configure({ level: 'debug' })
  }

  // 1. Always use CWD as cache root — in monorepo this naturally unifies all sub-package caches;
  //    in single-package this is a no-op since cacheRoot === projectPath.
  setGlobalConfig({ cacheRoot: process.cwd() })
  logger.debug('Cache root:', process.cwd())

  // 2. Resolve project directories
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

  if (projects.length === 0)
    return

  // 3. Branch routing
  if (projects.length === 1) {
    // Single project: existing MultiGeneratorRenderer path — 100% unchanged behaviour
    const proj = projects[0]
    await generateForProject(proj)
  }
  else {
    // Multi-project: new MultiProjectRenderer + sequential execution
    // Sequential execution avoids singleton config state clashes and ensures
    // one project's failure doesn't affect others.
    const projectInfos: ProjectInfo[] = projects.map(p => ({
      dir: p.dir,
      configPath: p.configPath,
      generators: p.generators,
    }))
    const renderer = new MultiProjectRenderer(projectInfos, pkg.version)

    const allResults: boolean[][] = []
    const recorded: RecordedChangeInfo[] = []
    for (let pi = 0; pi < projects.length; pi++) {
      const proj = projects[pi]
      try {
        const results = await generate(proj.config, {
          projectPath: proj.dir,
          onProgress(event) {
            renderer.onProjectEvent(pi, event)
          },
          onChangeRecorded(change) {
            recorded.push(change)
          },
        })
        allResults.push(results)
      }
      catch (error: any) {
        // Mark all generators as failed for this project so the renderer
        // can display the error properly.
        const failResults = proj.generators.map((_, gi) => {
          renderer.onProjectEvent(pi, { index: gi, phase: 'failed', error: error.message || 'Unknown error' })
          return false
        })
        allResults.push(failResults)
      }
    }

    renderer.finalize(allResults)
    printRecordedChanges(recorded)
  }
}

// ──────────────────────────────────────────────────────────────
// `worma diff` — browse recorded API changes (requirement B)
// ──────────────────────────────────────────────────────────────

/**
 * Format a timestamp in the **local** time zone (`YYYY-MM-DD HH:mm:ss`).
 *
 * `toISOString()` renders UTC, which made every record look ~8h off for anyone
 * outside UTC and is the reason a record created at noon showed up as 04:xx.
 */
function formatTime(ts: number): string {
  const date = new Date(ts)
  if (Number.isNaN(date.getTime()))
    return '-'
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/**
 * Build a bordered `cli-table3` instance with our theme colours applied to the
 * header (the library's own head/border colours are disabled so our `theme`
 * palette wins). ANSI escape codes are measured as zero-width by cli-table3's
 * internal `string-width` layout, so coloured cells stay aligned.
 */
function createTable(head: string[]): any {
  return new Table({
    head,
    style: { head: [], border: [] },
  })
}

/** `worma diff` / `worma diff <id>` / `worma diff latest` */
export async function actionDiff(
  id: string | undefined,
  { list, project }: { list?: boolean, project?: string },
): Promise<void> {
  const projectPath = project
    ? (path.isAbsolute(project) ? project : path.resolve(process.cwd(), project))
    : process.cwd()

  // Mirror `actionGen`: always resolve the cache from CWD so monorepo
  // sub-packages share one unified cache root.
  setGlobalConfig({ cacheRoot: process.cwd() })

  const { countChanges, getChange, listChanges } = await import('@/functions/changeReport')

  if (!id || list) {
    const summaries = await listChanges(projectPath)
    if (summaries.length === 0) {
      console.log(`\n  ${theme.dim('No change records found.')}`)
      console.log(`  ${theme.dim('Run `worma gen` after changing your spec to create one.')}\n`)
      return
    }
    const table = createTable([
      theme.label('ID'),
      theme.label('CREATED'),
      theme.label('OUTPUTS'),
      theme.label('CHANGES'),
    ])
    summaries.forEach(s => table.push([
      s.id,
      formatTime(s.createdAt),
      s.outputs.join(', ') || '-',
      `+${s.summary.added} / -${s.summary.removed} / ~${s.summary.modified}`,
    ]))
    console.log('')
    console.log(table.toString())
    console.log('')
    return
  }

  const change = await getChange(projectPath, id)
  if (!change) {
    console.log(`\n  ${theme.warning('?')} No change record found for "${id}".\n`)
    return
  }

  console.log('')
  console.log(`  ${theme.label(`Change ${change.id}`)}  ${theme.dim(formatTime(change.createdAt))}`)
  console.log('')

  const totals = countChanges(change.generators)

  for (const gen of change.generators) {
    console.log(`  ${theme.header(gen.serverName ? `${gen.output}  (${gen.serverName})` : gen.output)}`)
    if (gen.changes.length === 0) {
      console.log(`    ${theme.dim('no changes')}`)
      console.log('')
      continue
    }

    // Every change is one row: component changes carry their affected
    // operations in `affects`, listed under the change itself (one per line).
    const table = createTable([
      '',
      theme.label('TYPE'),
      theme.label('TARGET'),
      theme.label('ITEM'),
      theme.label('CHANGE'),
      theme.label('LEVEL'),
    ])
    for (const row of gen.changes) {
      table.push([
        opText(row.op),
        theme.dim(row.kind),
        row.target,
        row.item ?? '',
        changeCell(row),
        levelText(row.level),
      ])
    }
    console.log(table.toString())
    console.log('')
  }

  console.log(`  ${theme.label('Total:')} ${theme.success(`+${totals.added} added`)}, ${theme.error(`-${totals.removed} removed`)}, ${theme.warning(`~${totals.modified} modified`)}`)
  console.log('')
}

/**
 * `CHANGE` cell of one row: the change itself plus, for a component change, the
 * operations it affects — one per line, so nothing is folded away.
 */
function changeCell(row: SourceChange): string {
  return [row.detail, ...(row.affects ?? [])].filter(Boolean).join('\n')
}

/** `+` / `-` / `~` cell with the matching palette colour. */
function opText(op: ChangeOp): string {
  if (op === '+')
    return theme.success(op)
  if (op === '-')
    return theme.error(op)
  return theme.warning(op)
}

/** Severity cell with the matching palette colour. */
function levelText(level: ChangeLevel): string {
  if (level === 'breaking')
    return theme.error(level)
  if (level === 'additive')
    return theme.success(level)
  return theme.dim(level)
}

/**
 * Close a `worma gen` run with the change-record pointer: the id(s) written by
 * this run plus the command showing their details.
 *
 * A run that recorded nothing (the source document did not change) prints no
 * closing line at all.
 */
export function printRecordedChanges(recorded: RecordedChangeInfo[]): void {
  if (recorded.length === 0)
    return
  const totals = recorded.reduce(
    (acc, change) => ({
      added: acc.added + change.added,
      removed: acc.removed + change.removed,
      modified: acc.modified + change.modified,
    }),
    { added: 0, removed: 0, modified: 0 },
  )
  const ids = recorded.map(change => change.id).join(', ')
  console.log(`\n  ${theme.success('✔')} Changes recorded: ${theme.label(ids)} ${theme.dim(`(+${totals.added}/-${totals.removed}/~${totals.modified})`)}`)
  console.log(`  ${theme.dim('Run `worma diff latest` to view the details.')}\n`)
}

async function generateForProject(entry: ProjectEntry): Promise<void> {
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
  const recorded: RecordedChangeInfo[] = []
  const results = await generate(config, {
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
    onChangeRecorded(change) {
      recorded.push(change)
    },
  })

  // Finalize — Phase 3: stop live-update, show concise ✔/✖ summary
  const failedCount = results.filter(r => !r).length
  renderer.finalize(failedCount)
  printRecordedChanges(recorded)
}
