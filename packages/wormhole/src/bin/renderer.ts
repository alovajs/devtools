import type { GeneratorConfig } from '@/type'
import type { GeneratorProgressEvent } from '@/type/lib'
import type { TemplatePreset } from '@/createConfig'
import { createLogUpdate } from 'log-update'
import { theme, icons } from './theme'

type LogUpdateFn = ReturnType<typeof createLogUpdate>

interface GeneratorState {
  index: number
  input: string
  output: string
  status: 'pending' | 'active' | 'done' | 'failed' | 'skipped'
  progress: number
  stage: string
  error?: string
  startTime?: number
  endTime?: number
}

const BAR_WIDTH = 20

function formatProgressBar(progress: number): string {
  const clamped = Math.max(0, Math.min(100, progress))
  const filled = Math.round((clamped / 100) * BAR_WIDTH)
  const empty = BAR_WIDTH - filled
  return theme.header('█'.repeat(filled)) + theme.dim('░'.repeat(empty))
}

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`
}

function separatorWidth(): number {
  const cols = process.stdout.columns || 80
  return Math.min(cols - 2, 60)
}

function sep(): string {
  return theme.dim('─'.repeat(separatorWidth()))
}

/** Project info passed to MultiProjectRenderer for each sub-package in monorepo mode. */
export interface ProjectInfo {
  dir: string
  configPath: string
  generators: GeneratorConfig[]
}

/**
 * Terminal live-progress renderer for the `alova gen` command.
 *
 * Layout (three phases)
 * ──────────────────────────────────────────
 * Phase 1 — Pre-flight (static, printed once)
 *   Alova API Generator  v2.0.0
 *
 *     Config: ./alova.config.ts
 *     Generators: 3
 *   ─────
 *     ○ input1 → output1
 *     ○ input2 → output2
 *     ○ input3 → output3
 *   ─────
 *
 * Phase 2 — Generation (live-update via log-update)
 *     ✔ input1 → output1
 *
 *     ◉ input2 → output2
 *       ██████████░░░░░░░░░░  50%  processing templates
 *
 *     ○ input3 → output3
 *   ─────
 *     ⏱ 3.2s  ✔ 1  ◉ 1  ○ 1  3 total
 *
 * Phase 3 — Summary (after done())
 *   ✔ Generated successfully!
 * ──────────────────────────────────────────
 */
export class MultiGeneratorRenderer {
  private states: GeneratorState[]
  private version: string
  private startTime: number
  private logUpdateInstance: LogUpdateFn | null = null

  constructor(generators: GeneratorConfig[], version: string, configPath: string) {
    this.states = generators.map((g, i) => ({
      index: i,
      input: Array.isArray(g.input) ? (g.input[0] || '') : (g.input || ''),
      output: g.output || '',
      status: 'pending' as const,
      progress: 0,
      stage: '',
    }))
    this.version = version
    this.startTime = Date.now()

    // ── Phase 1: Pre-flight ──
    this.printPreFlight(configPath)

    // ── Phase 2: live-update area ──
    this.logUpdateInstance = createLogUpdate(process.stdout, { showCursor: false })
    this.render()
  }

  /** Print static pre-flight info (config path, generator count, input→output mapping). */
  private printPreFlight(configPath: string): void {
    const lines: string[] = []

    lines.push('')
    lines.push(`  ${theme.header('Alova API Generator')}  ${theme.version(`v${this.version}`)}`)
    lines.push('')

    lines.push(`    ${theme.label('Config:')}      ${theme.path(configPath)}`)
    lines.push(`    ${theme.label('Generators:')}  ${this.states.length}`)
    lines.push(`  ${sep()}`)
    lines.push('')

    console.log(lines.join('\n'))
  }

  // ── State transitions ──────────────────────────────────────────

  setActive(index: number): void {
    this.states[index].status = 'active'
    this.states[index].startTime = Date.now()
    this.states[index].progress = 0
    this.states[index].stage = 'starting'
    this.render()
  }

  setProgress(index: number, progress: number, stage: string): void {
    const st = this.states[index]
    // Guard: don't revert a terminal status back to active.
    if (st.status === 'done' || st.status === 'failed' || st.status === 'skipped') {
      return
    }
    st.status = 'active'
    st.progress = Math.max(0, Math.min(100, progress))
    st.stage = stage
    this.render()
  }

  setDone(index: number, resolvedInput?: string): void {
    const st = this.states[index]
    st.status = 'done'
    st.progress = 100
    st.stage = 'completed'
    st.endTime = Date.now()
    if (resolvedInput) st.input = resolvedInput
    this.render()
  }

  setFailed(index: number, error: string): void {
    const st = this.states[index]
    st.status = 'failed'
    st.error = error
    st.endTime = Date.now()
    this.render()
  }

  setSkipped(index: number, resolvedInput?: string): void {
    const st = this.states[index]
    st.status = 'skipped'
    st.stage = 'skipped'
    st.endTime = Date.now()
    if (resolvedInput) st.input = resolvedInput
    this.render()
  }

  // ── Phase 2: Live-update rendering ─────────────────────────────

  render(): void {
    if (!this.logUpdateInstance) return

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1)
    const doneCount = this.states.filter(s => s.status === 'done').length
    const failedCount = this.states.filter(s => s.status === 'failed').length
    const activeCount = this.states.filter(s => s.status === 'active').length
    const skippedCount = this.states.filter(s => s.status === 'skipped').length

    const lines: string[] = []

    // Generator rows
    const maxInputLen = Math.max(...this.states.map(s => s.input.length), 8)
    const maxOutputLen = Math.max(...this.states.map(s => s.output.length), 8)

    for (const st of this.states) {
      const icon = icons[st.status]
      const idx = `[${st.index + 1}/${this.states.length}]`
      const input = theme.path(st.input.padEnd(maxInputLen))
      const output = theme.path(st.output.padEnd(maxOutputLen))

      let row = `    ${icon} ${idx} ${input} ${icons.arrow} ${output}`

      if (st.status === 'active') {
        const bar = formatProgressBar(st.progress)
        const pct = `${st.progress.toFixed(0).padStart(3)}%`
        const stage = st.stage ? ` ${theme.stage(st.stage)}` : ''
        row += `\n      ${bar} ${pct}${stage}`
      }
      else if (st.status === 'done') {
        row += `  ${theme.dim(formatDuration(st.endTime! - st.startTime!))}`
      }
      else if (st.status === 'failed') {
        row += `\n      ${theme.error(`✖ ${st.error || 'failed'}`)}`
      }
      else if (st.status === 'skipped') {
        row += `  ${theme.dim('up-to-date')}`
      }

      // Add blank line between rows for readability
      lines.push(row)
      lines.push('')
    }

    // Status bar
    lines.push(`  ${sep()}`)

    const parts: string[] = []
    parts.push(`${theme.label('⏱')} ${elapsed}s`)
    if (doneCount > 0)
      parts.push(`${theme.success(`✔ ${doneCount}`)}`)
    if (failedCount > 0)
      parts.push(`${theme.error(`✖ ${failedCount}`)}`)
    if (activeCount > 0)
      parts.push(`${theme.header(`◉ ${activeCount}`)}`)
    if (skippedCount > 0)
      parts.push(`${theme.warning(`⊗ ${skippedCount}`)}`)
    parts.push(`${theme.dim(`${this.states.length} total`)}`)

    lines.push(`  ${parts.join('  ')}`)

    this.logUpdateInstance(lines.join('\n'))
  }

  // ── Phase 3: Summary ───────────────────────────────────────────

  /**
   * Finalize the display: stop live-update (keep last render visible),
   * then show a concise ✔ / ✖ result.
   *
   * @param failedCount - Number of generators that ended in failure.
   */
  finalize(failedCount: number): void {
    if (this.logUpdateInstance) {
      this.render() // ensure final state
      this.logUpdateInstance.done()
      this.logUpdateInstance = null
    }

    if (failedCount === 0) {
      console.log(theme.success('\n✔ Generated successfully!\n'))
    }
    else {
      console.log(theme.dim('\n  Try `alova gen -f` to force regenerate.\n'))
    }
  }
}

/**
 * Terminal live-progress renderer for the `alova gen` command in monorepo
 * (multi-project) mode.
 *
 * Displays every sub-package's generator progress simultaneously so the user
 * can see all projects at a glance.
 *
 * Layout
 * ──────────────────────────────────────────
 *   Alova API Generator  v2.0.0
 *     Packages:   3
 *
 *   ── Project 1/3  packages/a ──────────────────────
 *     Config:      ./packages/a/alova.config.ts
 *     Generators:  2
 *   ─────
 *     ○ [1/2] inputA1 → outputA1
 *     ○ [2/2] inputA2 → outputA2
 *
 *   ── Project 2/3  packages/b ──────────────────────
 *     Config:      ./packages/b/alova.config.ts
 *     Generators:  2
 *   ─────
 *     ✔ [1/2] inputB1 → outputB1  2.1s
 *     ◉ [2/2] inputB2 → outputB2
 *       ██████░░░░░░░░░░░░  30%  parsing openapi
 *   ─────
 *     ⏱ 5.2s  ✔ 1  ◉ 1  ○ 0  2 generators
 *
 *   ── Project 3/3  packages/c ──────────────────────
 *     ...
 *   ─────
 *     ⏱ 5.2s  ✔ 2  ◉ 1  ○ 2  5 generators
 *
 *   ──────────────────────────────────────────
 *     ⏱ 8.3s  ✔ 5  ◉ 1  ○ 3  9 total
 * ──────────────────────────────────────────
 */
export class MultiProjectRenderer {
  private projects: {
    info: ProjectInfo
    states: GeneratorState[]
    startTime: number
  }[]
  private version: string
  private logUpdateInstance: LogUpdateFn | null = null

  constructor(projects: ProjectInfo[], version: string) {
    this.projects = projects.map(info => ({
      info,
      states: info.generators.map((g, i) => ({
        index: i,
        input: Array.isArray(g.input) ? (g.input[0] || '') : (g.input || ''),
        output: g.output || '',
        status: 'pending' as const,
        progress: 0,
        stage: '',
      })),
      startTime: Date.now(),
    }))
    this.version = version

    // ── Phase 1: Pre-flight ──
    this.printPreFlight()

    // ── Phase 2: live-update area ──
    this.logUpdateInstance = createLogUpdate(process.stdout, { showCursor: false })
    this.render()
  }

  // ── State transitions ──────────────────────────────────────────

  /** Route a per-generator progress event to its project. */
  onProjectEvent(projectIndex: number, event: GeneratorProgressEvent): void {
    const proj = this.projects[projectIndex]
    if (!proj) return
    const st = proj.states[event.index]
    if (!st) return

    switch (event.phase) {
      case 'active':
        st.status = 'active'
        st.startTime = Date.now()
        st.progress = 0
        st.stage = 'starting'
        break
      case 'progress':
        // Guard: don't revert a terminal status back to active.
        if (st.status === 'done' || st.status === 'failed' || st.status === 'skipped') {
          return
        }
        st.status = 'active'
        st.progress = Math.max(0, Math.min(100, event.progress))
        st.stage = event.message
        break
      case 'done':
        st.status = 'done'
        st.progress = 100
        st.stage = 'completed'
        st.endTime = Date.now()
        if (event.resolvedInput) st.input = event.resolvedInput
        break
      case 'failed':
        st.status = 'failed'
        st.error = event.error
        st.endTime = Date.now()
        break
      case 'skipped':
        st.status = 'skipped'
        st.stage = 'skipped'
        st.endTime = Date.now()
        if (event.resolvedInput) st.input = event.resolvedInput
        break
    }
    this.render()
  }

  // ── Phase 1: Pre-flight ─────────────────────────────────────

  /**
   * Print a minimal static header. All project details (generator
   * mappings, progress, status) live inside the `log-update` area
   * so that every project remains visible regardless of terminal
   * height and project count.
   */
  private printPreFlight(): void {
    const lines: string[] = []
    lines.push('')
    lines.push(`  ${theme.header('Alova API Generator')}  ${theme.version(`v${this.version}`)}`)
    lines.push(`    ${theme.label('Packages:')}   ${this.projects.length}`)
    lines.push('')
    console.log(lines.join('\n'))
  }

  // ── Phase 2: Live-update rendering ─────────────────────────────

  render(): void {
    if (!this.logUpdateInstance) return

    const lines: string[] = []

    for (let pi = 0; pi < this.projects.length; pi++) {
      const proj = this.projects[pi]

      const doneCount = proj.states.filter(s => s.status === 'done').length
      const failedCount = proj.states.filter(s => s.status === 'failed').length
      const activeCount = proj.states.filter(s => s.status === 'active').length
      const skippedCount = proj.states.filter(s => s.status === 'skipped').length
      const pendingCount = proj.states.filter(s => s.status === 'pending').length
      const elapsed = ((Date.now() - proj.startTime) / 1000).toFixed(1)
      const allTerminal = pendingCount === 0 && activeCount === 0

      if (allTerminal) {
        // ── Collapsed: one-line summary for completed projects ──
        const parts: string[] = []
        if (failedCount > 0) {
          parts.push(theme.error('✖'))
        }
        else {
          parts.push(theme.success('✔'))
        }
        parts.push(theme.header(`Project ${pi + 1}/${this.projects.length}`))
        parts.push(theme.path(proj.info.dir))
        parts.push(`${theme.label('⏱')} ${elapsed}s`)
        if (doneCount > 0)
          parts.push(theme.success(`✔ ${doneCount}`))
        if (failedCount > 0)
          parts.push(theme.error(`✖ ${failedCount}`))
        if (skippedCount > 0)
          parts.push(theme.warning(`⊗ ${skippedCount}`))
        lines.push(`  ${parts.join('  ')}`)
      }
      else {
        // ── Expanded: full project detail ──
        lines.push(`  ${theme.header(`── Project ${pi + 1}/${this.projects.length}`)}  ${theme.path(proj.info.dir)} ${theme.dim('─'.repeat(Math.max(0, 20)))}`)
        lines.push(`    ${theme.label('Config:')}      ${theme.path(proj.info.configPath)}`)
        lines.push(`    ${theme.label('Generators:')}  ${proj.states.length}`)
        lines.push(`  ${theme.dim('─'.repeat(5))}`)

        // Generator rows
        const maxInputLen = Math.max(...proj.states.map(s => s.input.length), 8)
        const maxOutputLen = Math.max(...proj.states.map(s => s.output.length), 8)

        for (const st of proj.states) {
          const icon = icons[st.status]
          const idx = `[${st.index + 1}/${proj.states.length}]`
          const input = theme.path(st.input.padEnd(maxInputLen))
          const output = theme.path(st.output.padEnd(maxOutputLen))

          let row = `    ${icon} ${idx} ${input} ${icons.arrow} ${output}`

          if (st.status === 'active') {
            const bar = formatProgressBar(st.progress)
            const pct = `${st.progress.toFixed(0).padStart(3)}%`
            const stage = st.stage ? ` ${theme.stage(st.stage)}` : ''
            row += `\n      ${bar} ${pct}${stage}`
          }
          else if (st.status === 'done') {
            row += `  ${theme.dim(formatDuration(st.endTime! - st.startTime!))}`
          }
          else if (st.status === 'failed') {
            row += `\n      ${theme.error(`✖ ${st.error || 'failed'}`)}`
          }
          else if (st.status === 'skipped') {
            row += `  ${theme.dim('up-to-date')}`
          }

          lines.push(row)
          lines.push('')
        }

        lines.push(`  ${theme.dim('─'.repeat(5))}`)

        // Per-project status bar
        const parts: string[] = []
        parts.push(`${theme.label('⏱')} ${elapsed}s`)
        if (doneCount > 0)
          parts.push(`${theme.success(`✔ ${doneCount}`)}`)
        if (failedCount > 0)
          parts.push(`${theme.error(`✖ ${failedCount}`)}`)
        if (activeCount > 0)
          parts.push(`${theme.header(`◉ ${activeCount}`)}`)
        if (skippedCount > 0)
          parts.push(`${theme.warning(`⊗ ${skippedCount}`)}`)
        parts.push(`${theme.dim(`${proj.states.length} generators`)}`)

        lines.push(`  ${parts.join('  ')}`)
      }

      if (pi < this.projects.length - 1) {
        lines.push('')
      }
    }

    // Global separator and aggregate stats
    lines.push(`  ${sep()}`)

    let totalDone = 0, totalFailed = 0, totalActive = 0, totalSkipped = 0, totalGens = 0
    for (const proj of this.projects) {
      totalDone += proj.states.filter(s => s.status === 'done').length
      totalFailed += proj.states.filter(s => s.status === 'failed').length
      totalActive += proj.states.filter(s => s.status === 'active').length
      totalSkipped += proj.states.filter(s => s.status === 'skipped').length
      totalGens += proj.states.length
    }

    const totalElapsed = ((Date.now() - this.projects[0].startTime) / 1000).toFixed(1)
    const totalParts: string[] = []
    totalParts.push(`${theme.label('⏱')} ${totalElapsed}s`)
    if (totalDone > 0)
      totalParts.push(`${theme.success(`✔ ${totalDone}`)}`)
    if (totalFailed > 0)
      totalParts.push(`${theme.error(`✖ ${totalFailed}`)}`)
    if (totalActive > 0)
      totalParts.push(`${theme.header(`◉ ${totalActive}`)}`)
    if (totalSkipped > 0)
      totalParts.push(`${theme.warning(`⊗ ${totalSkipped}`)}`)
    totalParts.push(`${theme.dim(`${totalGens} total`)}`)

    lines.push(`  ${totalParts.join('  ')}`)

    this.logUpdateInstance(lines.join('\n'))
  }

  // ── Phase 3: Summary ───────────────────────────────────────────

  /**
   * Finalize the display: stop live-update, then show a concise ✔ / ✖ summary.
   *
   * @param allResults - `boolean[][]` array of per-project per-generator results.
   */
  finalize(allResults: boolean[][]): void {
    if (this.logUpdateInstance) {
      this.render() // ensure final state
      this.logUpdateInstance.done()
      this.logUpdateInstance = null
    }

    const totalFailed = allResults.flat().filter(r => !r).length
    if (totalFailed === 0) {
      console.log(theme.success('\n✔ Generated successfully!\n'))
    }
    else {
      console.log(theme.dim('\n  Try `alova gen -f` to force regenerate.\n'))
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// InitRenderer — static display for `alova init`
// ─────────────────────────────────────────────────────────────────

/** Available template presets for interactive selection. */
export const INIT_TEMPLATE_CHOICES: { name: string, value: TemplatePreset }[] = [
  { name: 'alova', value: 'alova' },
  { name: 'axios', value: 'axios' },
  { name: 'fetch', value: 'fetch' },
  { name: 'ky', value: 'ky' },
]

/**
 * Static-display renderer for the `alova init` command.
 *
 * Unlike MultiGeneratorRenderer / MultiProjectRenderer, init does NOT use
 * log-update — it's a linear, single-step operation with no live progress.
 *
 * Layout
 * ──────────────────────────────────────────
 *   Alova API Generator  v2.0.0
 *
 *     Project:      /Users/me/my-project
 *     Type:         typescript  (auto-detected)
 *     Template:     alova
 *     Output:       /Users/me/my-project/alova.config.ts
 *
 *   ──────────────────────────────────────────
 *   ✔ Configuration initialized successfully!
 *
 *     Next steps:
 *       alova gen
 */
export class InitRenderer {
  private version: string

  constructor(version: string) {
    this.version = version
  }

  /** Print the unified header (shared with gen command). */
  printHeader(): void {
    console.log('')
    console.log(`  ${theme.header('Alova API Generator')}  ${theme.version(`v${this.version}`)}`)
    console.log('')
  }

  /** Print project and type info (shown before template selection / overwrite check). */
  printProjectInfo(projectPath: string, type: string, isAutoDetected: boolean): void {
    const typeDisplay = isAutoDetected
      ? `${type}  ${theme.dim('(auto-detected)')}`
      : type
    console.log(`    ${theme.label('Project:')}      ${theme.path(projectPath)}`)
    console.log(`    ${theme.label('Type:')}         ${typeDisplay}`)
  }

  /** Print template preset and output path (shown after template is determined). */
  printConfigInfo(template: string, outputPath: string): void {
    console.log(`    ${theme.label('Template:')}     ${template}`)
    console.log(`    ${theme.label('Output:')}       ${theme.path(outputPath)}`)
  }

  /** Print the separator line. */
  printSeparator(): void {
    console.log(`  ${sep()}`)
  }

  /** Print success summary with next-steps hint. */
  printSuccess(): void {
    console.log(theme.success('✔ Configuration initialized successfully!'))
    console.log('')
    console.log(`    ${theme.label('Next steps:')}`)
    console.log('      alova gen')
    console.log('')
  }

  /** Print skipped result (config file already exists). */
  printSkipped(outputPath: string): void {
    console.log(icons.skipped + theme.dim(` Skipped: ${outputPath} already exists`))
    console.log('')
  }

  /** Print failure result. */
  printFailure(error: string): void {
    console.log(theme.error(`✖ ${error}`))
    console.log('')
  }
}
