import type { OutputChannel } from 'vscode'
import util from 'node:util'
import { useLogger } from 'reactive-vscode'
import { window } from 'vscode'
import { displayName, IGNORE_ERROR } from '@/meta'

export const logger = useLogger(displayName)

export interface LogOptions {
  prompt?: boolean
  indent?: number
}
export class Log {
  static get $() {
    return logger
  }

  static get outputChannel(): OutputChannel {
    return logger.outputChannel
  }

  static raw(...values: any[]) {
    this.outputChannel.appendLine(values.map(i => i.toString()).join(' '))
  }

  static info(message: string, options?: LogOptions) {
    const { prompt = false, indent = 0 } = options ?? {}
    if (prompt) {
      window.showInformationMessage(message)
    }
    this.outputChannel.appendLine(`${'\t'.repeat(indent)}${message}`)
  }

  static warn(message: string, options?: LogOptions) {
    if (options?.prompt) {
      window.showWarningMessage(message)
    }
    Log.info(`⚠ WARN: ${message}`, { ...options, prompt: false })
  }

  static async error(err: Error | string | any = {}, options?: LogOptions) {
    if (IGNORE_ERROR.includes(err?.name)) {
      return
    }
    if (typeof err !== 'string') {
      const messages = [err.message, err.response?.data, err.stack, err.toJSON?.()].filter(Boolean).join('\n')
      Log.info(`🐛 ERROR: ${err.name}: ${messages}`, { ...options, prompt: false })
    }

    if (options?.prompt) {
      const openOutputButton = '显示日志'
      const message = typeof err === 'string' ? err : `${displayName} Error: ${err.toString()}`
      const result = await window.showErrorMessage(message, openOutputButton)
      if (result === openOutputButton) {
        this.show()
      }
    }
  }

  static show(preserveFocus?: boolean) {
    return logger.show(preserveFocus)
  }

  static divider() {
    this.outputChannel.appendLine('\n――――――\n')
  }

  static output(type: 'log' | 'warn' | 'error', ...messageArr: any[]) {
    if (messageArr.some(item => IGNORE_ERROR.some(error => `${item}`.includes(error)))) {
      return
    }
    let result = ''
    switch (type) {
      case 'log':
        result += `🟢 [LOG] `
        break
      case 'warn':
        result += `🟡 [WARN] `
        break
      case 'error':
        result += `🔴 [ERROR] `
        break
      default:
        break
    }
    messageArr.forEach((message) => {
      if (typeof message === 'object') {
        message = util.inspect(message, { showHidden: true, depth: null, colors: false })
      }
      result += `${message} `
    })
    this.outputChannel.appendLine(result)
  }
}
export default Log
