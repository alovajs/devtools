import type { Disposable } from 'vscode'
import type { CheckUpdatesResult, SourceUpdateInfo } from 'wormajs'
import { commands, window, workspace } from 'vscode'
import { Commands } from '@/commands/commands'
import { setUpdateIndicator } from '@/commands/statusBar'
import worma from '@/helper/worma'
import { displayName } from '@/meta'
import { Log } from '@/utils'
import Global from './Global'

export interface AutoUpdateConfig {
  checkOnActivation: boolean
  checkOnWindowFocus: boolean
  minInterval: number
}

const DEFAULTS: AutoUpdateConfig = {
  checkOnActivation: true,
  checkOnWindowFocus: true,
  minInterval: 300_000, // 5 minutes
}

export function getAutoUpdateConfig(): AutoUpdateConfig {
  const section = workspace.getConfiguration('worma.autoUpdate')
  const read = <K extends keyof AutoUpdateConfig>(key: K): AutoUpdateConfig[K] =>
    section.get<AutoUpdateConfig[K]>(key) ?? DEFAULTS[key]

  const minIntervalRaw = read('minInterval')
  return {
    checkOnActivation: read('checkOnActivation'),
    checkOnWindowFocus: read('checkOnWindowFocus'),
    minInterval: Number.isFinite(minIntervalRaw) ? Number(minIntervalRaw) : DEFAULTS.minInterval,
  }
}

/** Stable key for the de-duplication map: one project + one output. */
function sourceKey(projectPath: string, update: Pick<SourceUpdateInfo, 'output' | 'resolvedInput'>) {
  return `${projectPath}::${update.output}::${update.resolvedInput ?? ''}`
}

/**
 * Periodically (and on window focus) asks `worma.checkUpdates()` whether the
 * configured OpenAPI sources changed and — only then — asks the user whether
 * to regenerate.
 *
 * Detection is read-only: it never rewrites the user's code. Nothing is
 * generated until the user confirms.
 */
export default class UpdateChecker {
  /** hash already offered to the user, per source — avoids nagging twice */
  private static notified = new Map<string, string>()
  private static lastCheckAt = 0
  private static inFlight = false
  /** Deferred activation check, kept so it can be cancelled before it fires. */
  private static activationTimer: ReturnType<typeof setTimeout> | undefined
  /** Focus listener armed by the live registration, if any. */
  private static focusListener: Disposable | undefined

  /** Register the auto-update triggers. Returns the disposables to push into `ctx.subscriptions`. */
  static init(): Disposable[] {
    // `init()` replaces whatever a previous call armed: without this a stale
    // focus listener or a still-pending deferred check would keep firing even
    // though the current configuration disabled every trigger.
    this.unregisterTriggers()

    const disposables: Disposable[] = [
      workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('worma.autoUpdate')) {
          const cfg = getAutoUpdateConfig()
          // No active trigger left → nothing will ever refresh the dot, clear it.
          if (!cfg.checkOnActivation && !cfg.checkOnWindowFocus) {
            this.clear()
          }
          // Triggers may have been turned on or off → re-apply the config.
          this.unregisterTriggers()
          this.registerTriggers()
        }
      }),
      { dispose: () => this.unregisterTriggers() },
    ]

    this.registerTriggers()

    return disposables
  }

  /** Arm the triggers allowed by the current configuration. */
  private static registerTriggers() {
    const cfg = getAutoUpdateConfig()

    if (cfg.checkOnWindowFocus) {
      this.focusListener = window.onDidChangeWindowState((state) => {
        if (state.focused) {
          void this.check({ silent: true })
        }
      })
    }

    if (cfg.checkOnActivation) {
      // Deferred so activation is not blocked by the initial (silent) check.
      this.activationTimer = setTimeout(() => {
        this.activationTimer = undefined
        void this.check({ silent: true })
      }, 1500)
    }
  }

  /** Cancel every trigger armed by `registerTriggers()`. */
  private static unregisterTriggers() {
    if (this.focusListener) {
      this.focusListener.dispose()
      this.focusListener = undefined
    }
    if (this.activationTimer !== undefined) {
      clearTimeout(this.activationTimer)
      this.activationTimer = undefined
    }
  }

  /** Forget every pending notification and clear the status-bar dot. */
  static clear() {
    this.notified.clear()
    setUpdateIndicator(0)
  }

  /**
   * Run one detection pass over every configured project.
   *
   * @param options detection options.
   * @param options.silent when `true` (default for automatic triggers) errors
   * are only logged, never surfaced as a popup.
   * @param options.force bypasses the throttle interval.
   */
  static async check(options?: { silent?: boolean, force?: boolean }): Promise<CheckUpdatesResult[]> {
    const config = getAutoUpdateConfig()

    // Never interfere with a running generation, nor run twice concurrently.
    if (Global.loading || this.inFlight)
      return []

    const now = Date.now()
    const elapsed = now - this.lastCheckAt
    if (!options?.force && elapsed < config.minInterval) {
      const remaining = Math.ceil((config.minInterval - elapsed) / 1000)
      Log.info(`⏱️ update check skipped (throttled, ${remaining}s left)`)
      return []
    }
    this.lastCheckAt = now

    this.inFlight = true
    try {
      const entries = Global.getConfigs()
      const results: CheckUpdatesResult[] = []
      // Sources worth a confirmation toast (changed, hash not offered yet).
      const toastPending: Array<{ projectPath: string, update: SourceUpdateInfo }> = []
      // Everything the status-bar indicator should reflect: every `changed`
      // source (even after the user pressed Ignore — the dot must stay lit until
      // a successful regenerate) plus `new` sources of an already-generated
      // project (a brand-new project stays silent on its first run).
      let indicatorCount = 0

      for (const [projectPath, projectConfig] of entries) {
        let result: CheckUpdatesResult
        try {
          result = await worma.checkUpdates(projectConfig, { projectPath })
        }
        catch (error: any) {
          Log.error(error)
          if (!options?.silent)
            window.showErrorMessage(`${displayName}: ${error?.message ?? error}`)
          continue
        }
        results.push(result)
        this.logResult(result)

        for (const update of result.updates) {
          if (update.status === 'changed') {
            indicatorCount++
            const key = sourceKey(projectPath, update)
            if (this.notified.get(key) === update.hash)
              continue
            // Mark as offered *before* prompting so a notification the user never
            // answers can never trigger a duplicate toast later.
            this.notified.set(key, update.hash ?? '')
            toastPending.push({ projectPath, update })
          }
          else if (update.status === 'new' && result.hasGenerationBaseline) {
            indicatorCount++
          }
        }
      }

      setUpdateIndicator(indicatorCount)

      // Detection is done — release the lock *before* awaiting the prompt so an
      // unanswered notification can never block every future check.
      this.inFlight = false
      if (toastPending.length > 0)
        void this.prompt(toastPending)

      return results
    }
    finally {
      this.inFlight = false
    }
  }

  private static logResult(result: CheckUpdatesResult) {
    Log.info(`🔎 update check (${result.projectPath}): ${result.hasChanges ? 'changes detected' : 'up to date'}`)
    for (const update of result.updates) {
      Log.info(`   • ${update.output}: ${update.status}${update.error ? ` (${update.error})` : ''}`)
    }
  }

  private static async prompt(pending: Array<{ projectPath: string, update: SourceUpdateInfo }>) {
    const count = pending.length

    const generate = 'Generate'
    const ignore = 'Ignore'
    const picked = await window.showInformationMessage(
      `${displayName}: ${count} API source${count > 1 ? 's' : ''} updated. Generate now?`,
      generate,
      ignore,
    )

    // The offered hashes are recorded by `check()` before this prompt is shown,
    // so `Ignore` never nags again even if this promise stays unresolved.
    if (picked === generate) {
      const projectPaths = [...new Set(pending.map(p => p.projectPath))]
      for (const projectPath of projectPaths) {
        await commands.executeCommand(Commands.generate_api, projectPath)
      }
    }
    // `Ignore` intentionally does NOT clear the indicator: the "update
    // available" state must persist until the user actually regenerates, which
    // clears it on success in the generate flow.
  }
}
