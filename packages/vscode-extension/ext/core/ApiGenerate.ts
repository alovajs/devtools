import type { GenerateOption, ProjectStats } from '@/functions/generate'
import { window } from 'vscode'
import Error from '@/components/error'
import { showError } from '@/components/event'
import generate from '@/functions/generate'
import generateConfig from '@/functions/generateConfig'
import readConfig from '@/functions/readConfig'
import { getFileNameByPath, Log } from '@/utils'
import { getCurrentDirectory, getWorkspacePaths } from '@/utils/vscode'
import Global from './Global'
import VscodeClient from './VscodeClient'

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
    this.writeSummary(generateInfo.resultArr, generateInfo.projectStats)

    // ── Popup notification ──
    let totalDone = 0
    let totalSkipped = 0
    let totalFailed = 0
    for (const stats of generateInfo.projectStats.values()) {
      totalDone += stats.done
      totalSkipped += stats.skipped
      totalFailed += stats.failed
    }

    // Build per-project detail lines
    const lines: string[] = []
    for (const [workspaceRootDir] of generateInfo.resultArr) {
      const projectName = getFileNameByPath(workspaceRootDir)
      const stats = generateInfo.projectStats.get(workspaceRootDir)
      if (!stats || stats.done + stats.skipped + stats.failed === 0)
        continue

      const parts: string[] = []
      if (stats.done > 0)
        parts.push(`${stats.done} module${stats.done > 1 ? 's' : ''} updated`)
      if (stats.skipped > 0)
        parts.push(`${stats.skipped} up to date`)
      if (stats.failed > 0)
        parts.push(`${stats.failed} failed`)

      lines.push(`${projectName}: ${parts.join(', ')}`)
    }

    // Single-line summary (VSCode only shows first line in notifications)
    let summary: string

    if (lines.length === 0) {
      summary = '👌 Nothing to generate'
    }
    else if (totalDone > 0 && totalFailed === 0) {
      const parts: string[] = []
      if (totalDone > 0)
        parts.push(`${totalDone} module${totalDone > 1 ? 's' : ''} updated`)
      if (totalSkipped > 0)
        parts.push(`${totalSkipped} up to date`)
      summary = `🎉 Done! ${parts.join(', ')}`
    }
    else if (totalDone > 0 && totalFailed > 0) {
      const parts: string[] = []
      if (totalDone > 0)
        parts.push(`${totalDone} updated`)
      if (totalSkipped > 0)
        parts.push(`${totalSkipped} up to date`)
      if (totalFailed > 0)
        parts.push(`${totalFailed} failed`)
      summary = `⚠ Done, with errors: ${parts.join(', ')}`
    }
    else if (totalDone === 0 && totalFailed > 0) {
      summary = `❌ Generation failed: ${totalFailed} module${totalFailed > 1 ? 's' : ''} failed`
    }
    else if (totalSkipped > 0) {
      summary = `👌 Already up to date (${totalSkipped} module${totalSkipped > 1 ? 's' : ''})`
    }
    else {
      summary = '👌 Nothing to generate'
    }

    window.showInformationMessage(summary)

    VscodeClient.refreshDocs()
    this.generateErrorArr.push(...generateInfo.errorArr)
  }

  static getErrorArr() {
    return [...this.readErrorArr, ...this.generateErrorArr]
  }

  static showError() {
    this.getErrorArr().forEach((error) => {
      showError(error)
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
          : '📋 up to date'

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
    Log.divider()

    // Auto-show output panel only on failure
    if (totalFailed > 0) {
      Log.show(true)
    }
  }
}
