import type { GenerateChangeSummary, GenerateOption, ProjectStats } from '@/functions/generate'
import { window } from 'vscode'
import Error from '@/components/error'
import { showError } from '@/components/event'
import generate from '@/functions/generate'
import generateConfig from '@/functions/generateConfig'
import readConfig from '@/functions/readConfig'
import { displayName } from '@/meta'
import { getFileNameByPath, Log } from '@/utils'
import { getCurrentDirectory, getWorkspacePaths } from '@/utils/vscode'
import { ChangesView } from '@/views/changes'
import Global from './Global'
import VscodeClient from './VscodeClient'

/** Action shown on the success toast when the run recorded an API diff. */
const VIEW_CHANGES = 'View Changes'
/** Alias accepted by `ChangesView.open`, resolved to the newest record. */
const LATEST_CHANGE_ID = 'latest'

export default class ApiGenerate {
  private static readErrorArr: Error[] = []
  private static generateErrorArr: Error[] = []
  private static configNum = 0
  static async readConfig(path?: string | string[]) {
    const { configNum, errorArr } = await this.onlyReadConfig(path)
    this.readErrorArr.push(...errorArr)
    this.configNum = configNum
  }

  static async onlyReadConfig(path?: string | string[]) {
    const { configNum, errorArr } = await readConfig(path)
    return {
      configNum,
      errorArr,
    }
  }

  static async removeConfig(path?: string | string[]) {
    await this.onlyReadConfig()
    const dirs = path ? [path].flat() : getWorkspacePaths()
    dirs.forEach((dir) => {
      Global.deleteConfig(dir)
    })
    VscodeClient.refreshDocs()
  }

  static async addConfig(path?: string | string[]) {
    await this.onlyReadConfig(path)
    VscodeClient.refreshDocs()
  }

  static async generate(optins?: GenerateOption) {
    const generateInfo = await generate(optins)

    // ── Build Output Channel summary ──
    this.writeSummary(generateInfo.resultArr, generateInfo.projectStats, generateInfo.changeSummary)

    // ── Popup notification ──
    let totalDone = 0
    let totalFailed = 0
    for (const stats of generateInfo.projectStats.values()) {
      totalDone += stats.done
      totalFailed += stats.failed
    }

    // Never mask a real failure with a success / empty-state toast: the errors are
    // reported (and the output channel revealed) by showError().
    if (this.readErrorArr.length > 0 || generateInfo.errorArr.length > 0 || totalFailed > 0) {
      VscodeClient.refreshDocs()
      this.generateErrorArr.push(...generateInfo.errorArr)
      return
    }

    // Single-line summary (VSCode only shows first line in notifications).
    // Every non-failure path reaching here has `totalFailed === 0`.
    let summary = totalDone > 0
      ? `🎉 Done! ${totalDone} module${totalDone > 1 ? 's' : ''} updated`
      : '👌 Nothing to generate'

    // Requirement B: when this run recorded an API diff, mention it and offer a
    // shortcut that opens the API Changes view on the record just written.
    const changed = Object.values(generateInfo.changeSummary)
      .reduce((acc, item) => ({
        added: acc.added + item.added,
        removed: acc.removed + item.removed,
        modified: acc.modified + item.modified,
      }), { added: 0, removed: 0, modified: 0 })
    const changeTarget = Object.entries(generateInfo.changeSummary)
      .find(([, item]) => item.added + item.removed + item.modified > 0)

    if (changeTarget) {
      // The record id is part of the toast so the user can find it later; the
      // `View Changes` action below deep-links to it.
      summary += ` · Changes ${changeTarget[1].id} (+${changed.added}/-${changed.removed}/~${changed.modified})`
    }

    // no config could be loaded at all — an empty result then means "nothing
    // configured", not "nothing to do"
    if (this.configNum === 0) {
      window.showWarningMessage(`⚠ ${displayName}: No worma config found`)
    }
    else if (changeTarget) {
      const [projectPath, record] = changeTarget
      // intentionally not awaited: the popup lives until the user dismisses it
      void window.showInformationMessage(summary, VIEW_CHANGES).then((picked) => {
        if (picked === VIEW_CHANGES) {
          void ChangesView.open(record.id || LATEST_CHANGE_ID, projectPath)
        }
      })
    }
    else {
      window.showInformationMessage(summary)
    }

    VscodeClient.refreshDocs()
    this.generateErrorArr.push(...generateInfo.errorArr)
  }

  static getErrorArr() {
    return [...this.readErrorArr, ...this.generateErrorArr]
  }

  static async showError() {
    const errors = this.getErrorArr()
    if (errors.length === 0) {
      return
    }
    // write every error to the output channel, then surface a single popup
    errors.forEach((error) => {
      showError(error, { prompt: false })
    })

    const [first] = errors
    const rest = errors.length > 1 ? ` (+${errors.length - 1} more)` : ''
    const openOutputButton = 'Show Logs'

    // reveal the output channel right away so the details are visible even before
    // the notification is dismissed
    Log.show(true)
    // intentionally not awaited: the popup lives until the user dismisses it, and
    // blocking here would delay the caller's loading/cleanup
    void window.showErrorMessage(`${displayName}: ${first.message}${rest}`, openOutputButton).then((picked) => {
      if (picked === openOutputButton) {
        Log.show()
      }
    })
  }

  static checkConfig() {
    if (!this.configNum && !this.readErrorArr.length) {
      throw new Error('Expected to create worma.config.js in root directory.')
    }
  }

  static clear() {
    this.readErrorArr = []
    this.generateErrorArr = []
    this.configNum = 0
  }

  static createConfig() {
    return generateConfig(getCurrentDirectory())
  }

  private static writeSummary(
    resultArr: Array<[string, boolean]>,
    projectStats: Map<string, ProjectStats>,
    changeSummary: Record<string, GenerateChangeSummary> = {},
  ) {
    Log.divider()
    Log.raw('  ██╗    ██╗ ██████╗ ██████╗ ███╗   ███╗ █████╗')
    Log.raw('  ██║    ██║██╔═══██╗██╔══██╗████╗ ████║██╔══██╗')
    Log.raw('  ██║ █╗ ██║██║   ██║██████╔╝██╔████╔██║███████║')
    Log.raw('  ██║███╗██║██║   ██║██╔══██╗██║╚██╔╝██║██╔══██║')
    Log.raw('  ╚███╔███╔╝╚██████╔╝██║  ██║██║ ╚═╝ ██║██║  ██║')
    Log.raw('   ╚══╝╚══╝  ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝')
    Log.raw('           API Generation Summary')
    Log.divider()

    for (const [workspaceRootDir] of resultArr) {
      const projectName = getFileNameByPath(workspaceRootDir)
      const stats = projectStats.get(workspaceRootDir)

      if (!stats || (stats.done + stats.skipped + stats.failed) === 0) {
        Log.info(`📦 ${projectName}: no generators configured`)
        continue
      }

      // Status tag
      const statusTag = stats.failed > 0
        ? '⚠ partial'
        : stats.done > 0
          ? '✅ success'
          : '📋 skipped'

      Log.info(`📦 ${projectName}  [${statusTag}]`)

      // Counts
      const parts: string[] = []
      if (stats.done > 0)
        parts.push(`✅ ${stats.done} generated`)
      if (stats.skipped > 0)
        parts.push(`⏭️ ${stats.skipped} skipped`)
      if (stats.failed > 0)
        parts.push(`❌ ${stats.failed} failed`)
      Log.info(`   ${parts.join('  ')}`, { indent: 1 })

      // Sources
      if (stats.resolvedInputs.length > 0) {
        const uniqueSources = [...new Set(stats.resolvedInputs)]
        Log.info(`   📡 Source${uniqueSources.length > 1 ? 's' : ''}:`, { indent: 1 })
        uniqueSources.forEach(source => Log.info(`     • ${source}`, { indent: 2 }))
      }

      // Failed errors
      if (stats.failedErrors.length > 0) {
        const uniqueErrors = [...new Set(stats.failedErrors)]
        Log.info(`   ❌ Error${uniqueErrors.length > 1 ? 's' : ''}:`, { indent: 1 })
        uniqueErrors.forEach(err => Log.info(`     • ${err}`, { indent: 2 }))
      }
    }

    // Overall summary
    let totalDone = 0
    let totalSkipped = 0
    let totalFailed = 0
    let totalModules = 0
    for (const stats of projectStats.values()) {
      totalDone += stats.done
      totalSkipped += stats.skipped
      totalFailed += stats.failed
      totalModules += stats.done + stats.skipped + stats.failed
    }

    Log.divider()
    const summaryParts: string[] = [`${totalModules} total module${totalModules !== 1 ? 's' : ''}`]
    if (totalDone > 0)
      summaryParts.push(`${totalDone} generated`)
    if (totalSkipped > 0)
      summaryParts.push(`${totalSkipped} skipped`)
    if (totalFailed > 0)
      summaryParts.push(`${totalFailed} failed`)
    Log.info(`📊 ${summaryParts.join(', ')}`)

    // Change-record pointer, mirroring the CLI: the id(s) written by this run.
    // A run that recorded nothing (the sources did not change) stays silent.
    const records = Object.values(changeSummary)
    if (records.length > 0) {
      const totals = records.reduce(
        (acc, record) => ({
          added: acc.added + record.added,
          removed: acc.removed + record.removed,
          modified: acc.modified + record.modified,
        }),
        { added: 0, removed: 0, modified: 0 },
      )
      Log.info(`✔ Changes recorded: ${records.map(record => record.id).join(', ')} (+${totals.added}/-${totals.removed}/~${totals.modified})`)
      Log.info('Run "Worma: Review API Changes" to view the details.')
    }
    Log.divider()

    // Auto-show output panel only on failure
    if (totalFailed > 0 || this.readErrorArr.length > 0) {
      Log.show(true)
    }
  }
}
