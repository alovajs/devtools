import { getGlobalConfig } from '@/config'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
const DEFAULT_CONFIG = getGlobalConfig()
export interface LoggerOptions {
  level: LogLevel
  prefix?: string
  timestamp?: boolean
  colors?: boolean
}

class Logger {
  private options: LoggerOptions = {
    level: 'info',
    timestamp: true,
    colors: true,
  }

  configure(options: Partial<LoggerOptions>) {
    this.options = { ...this.options, ...options }
    return this
  }

  private getTimestamp(): string {
    return this.options.timestamp ? `[${new Date().toISOString()}] ` : ''
  }

  private formatMessage(level: LogLevel, message: string, details?: unknown): string {
    const timestamp = this.getTimestamp()
    const prefix = this.options.prefix ? `[${this.options.prefix}] ` : ''
    const detailsStr = details ? `\n${JSON.stringify(details, null, 2)}` : ''
    if (this.options.colors) {
      const colors = {
        debug: '\x1B[34m', // blue
        info: '\x1B[32m', // green
        warn: '\x1B[33m', // yellow
        error: '\x1B[31m', // red
        reset: '\x1B[0m',
      }
      return `${timestamp}${prefix}${colors[level]}[${level.toUpperCase()}]${colors.reset} ${message}${detailsStr}`
    }

    return `${timestamp}${prefix}[${level.toUpperCase()}] ${message}${detailsStr}`
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.options.level)
  }

  debug(message: string, details?: unknown): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('debug', message, details))
    }
  }

  info(message: string, details?: unknown): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(this.formatMessage('info', message, details))
    }
  }

  warn(message: string, details?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, details))
    }
  }

  private errorMsg(msg: string | Error) {
    return msg instanceof Error ? msg.message : msg
  }

  error(message: string, details?: unknown) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, details))
    }
  }

  throwError(error: string | Error, details?: unknown) {
    this.debug(this.errorMsg(error), details)
    return new DEFAULT_CONFIG.Error(this.errorMsg(error))
  }
}

// 导出单例实例
export const logger = new Logger().configure({
  level: 'info',
  timestamp: true,
  colors: true,
})

// 导出类型定义，方便用户扩展
export type { Logger }
