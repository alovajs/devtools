import Error from '@/components/error';
import { showError } from '@/components/event';
import { endLoading, loading } from '@/components/statusBar';
import generate, { type GenerateOption } from '@/functions/generate';
import readConfig from '@/functions/readConfig';
import { Log, getFileNameByPath } from '@/utils';

import Commands from './commands';

class ApiGenerate {
  static readErrorArr: Error[] = [];
  static generateErrorArr: Error[] = [];
  static async readConfig(path?: string | string[]) {
    const { configNum, errorArr } = await readConfig(path);
    this.readErrorArr.push(...errorArr);
    return configNum;
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
  static clear() {
    this.readErrorArr = [];
    this.generateErrorArr = [];
  }
}

export const refresh: CommandType = {
  commandId: Commands.refresh,
  handler: () => async () => {
    try {
      loading();
      if (!(await ApiGenerate.readConfig()) && !ApiGenerate.readErrorArr.length) {
        throw new Error('Expected to create alova.config.js in root directory.');
      }
      // Generate api file
      await ApiGenerate.generate({ force: true });
      ApiGenerate.showError();
    } catch (error) {
      showError(error);
    } finally {
      endLoading();
      ApiGenerate.clear();
    }
  }
};

export const generateApi: CommandType<[string]> = {
  commandId: Commands.generate_api,
  handler: () => async projectPath => {
    try {
      await ApiGenerate.readConfig(projectPath);
      // Generate api file
      await ApiGenerate.generate({ projectPath });
      ApiGenerate.showError();
    } catch (error) {
      showError(error);
    } finally {
      ApiGenerate.clear();
    }
  }
};
