import type { ExtensionContext } from 'vscode'
import type { Config, TemplateData } from 'wormajs'
import { EventEmitter } from 'vscode'

export default class Global {
  static context: ExtensionContext
  private static _enabled = false
  private static _loading = false
  private static _configMap = new Map<string, Config>()
  private static _onDidChangeConfig = new EventEmitter<string>()
  static readonly onDidChangeConfig = Global._onDidChangeConfig.event
  static templateData = new Map<string, TemplateData>()
  static init(context: ExtensionContext) {
    this.context = context
  }

  // enables
  static get enabled() {
    return this._enabled
  }

  static get loading() {
    return this._loading
  }

  static setEnabled(value: boolean) {
    if (value !== this._enabled) {
      this._enabled = value
    }
  }

  static setLoading(value: boolean) {
    if (value !== this._loading && this._enabled) {
      this._loading = value
    }
  }

  static getConfig(path: string) {
    return this._configMap.get(path)
  }

  static getConfigs() {
    return Array.from(this._configMap.entries())
  }

  static setConfig(path: string, config: Config) {
    this._configMap.set(path, config)
  }

  static emitConfigChange(path?: string) {
    this._onDidChangeConfig.fire(path ?? '')
  }

  static deleteConfig(path?: string | string[]) {
    const pathArray = path ? (Array.isArray(path) ? path : [path]) : [...this._configMap.keys()]
    pathArray.forEach((path) => {
      if (this._configMap.has(path)) {
        this._configMap.delete(path)
      }
    })
  }
}
