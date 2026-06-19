import type { GenerateProgress } from '@/type/lib'

export interface ProgressRenderOptions {
  /** Header line displayed above the per-source rows. */
  header?: string
  /** Width (in characters) of the bar segment. Default `20`. */
  barWidth?: number
}

/**
 * Render a single visual bar for a 0-100 progress value.
 */
export function formatProgressBar(progress: number, width = 20): string {
  const safe = Math.max(0, Math.min(100, progress))
  const filled = Math.round((safe / 100) * width)
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`
}

/**
 * Sort progress entries so the core lifecycle line is shown first
 * and plugin lines appear in stable alphabetical order.
 */
export function sortProgressEntries(snapshot: Record<string, GenerateProgress>): GenerateProgress[] {
  return Object.values(snapshot).sort((a, b) => {
    if (a.source === 'core')
      return -1
    if (b.source === 'core')
      return 1
    return a.source.localeCompare(b.source)
  })
}

/**
 * Render a multi-line snapshot suitable for use as `ora` spinner text.
 * Each source is printed on its own row prefixed by its name.
 */
export function renderProgressSnapshot(
  snapshot: Record<string, GenerateProgress>,
  options: ProgressRenderOptions = {},
): string {
  const { header, barWidth = 20 } = options
  const lines = sortProgressEntries(snapshot).map((entry) => {
    const pct = `${entry.progress.toFixed(0).padStart(3)}%`
    const message = entry.message ? ` ${entry.message}` : ''
    return `  [${entry.source}] ${formatProgressBar(entry.progress, barWidth)} ${pct}${message}`
  })
  return header ? [header, ...lines].join('\n') : lines.join('\n')
}

/**
 * Build a stateful renderer bound to a fixed header. Useful for CLI spinners
 * where the header (e.g. project path) does not change between updates.
 */
export function createProgressRenderer(header: string, options: Omit<ProgressRenderOptions, 'header'> = {}) {
  return (snapshot: Record<string, GenerateProgress>) =>
    renderProgressSnapshot(snapshot, { ...options, header })
}
