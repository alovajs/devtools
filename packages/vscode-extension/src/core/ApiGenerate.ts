import Error from '@/components/error';
import { showError } from '@/components/event';
import generate, { type GenerateOption } from '@/functions/generate';
import generateConfig from '@/functions/generateConfig';
import readConfig from '@/functions/readConfig';
import { Log, getFileNameByPath } from '@/utils';
import { getCurrentDirectory } from '@/utils/vscode';

export default class ApiGenerate {
  private static readErrorArr: Error[] = [];
  private static generateErrorArr: Error[] = [];
  private static configNum = 0;
  static async readConfig(path?: string | string[]) {
    const { configNum, errorArr } = await this.onlyReadConfig(path);
    this.readErrorArr.push(...errorArr);
    this.configNum = configNum;
  }
  static async onlyReadConfig(path?: string | string[]) {
    const { configNum, errorArr } = await readConfig(path);
    return {
      configNum,
      errorArr
    };
  }
  static async generate(optins?: GenerateOption) {
    const generateInfo = await generate(optins);
    for (const [workspaceRootDir, isGenerate] of generateInfo.resultArr) {
      if (isGenerate) {
        Log.info(`[${getFileNameByPath(workspaceRootDir)}]: Your API is updated`, { prompt: true });
      }
    }
    this.generateErrorArr.push(...generateInfo.errorArr);
  }
  static getErrorArr() {
    return [...this.readErrorArr, ...this.generateErrorArr];
  }
  static showError() {
    this.getErrorArr().forEach(error => {
      showError(error);
    });
  }
  static checkConfig() {
    if (!this.configNum && !this.readErrorArr.length) {
      throw new Error('Expected to create alova.config.js in root directory.');
    }
  }
  static clear() {
    this.readErrorArr = [];
    this.generateErrorArr = [];
    this.configNum = 0;
  }
  static createConfig() {
    return generateConfig(getCurrentDirectory());
  }
}
