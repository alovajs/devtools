import type { GenerateOption } from '@/functions/generate'
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
    for (const [workspaceRootDir, isGenerate] of generateInfo.resultArr) {
      if (isGenerate) {
        Log.info(`[${getFileNameByPath(workspaceRootDir)}]: Your API is updated`, { prompt: true })
      }
    }
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
      throw new Error('Expected to create alova.config.js in root directory.')
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
}
