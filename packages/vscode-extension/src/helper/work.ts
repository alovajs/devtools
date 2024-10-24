import Error from '@/components/error';
import { log } from '@/components/message';
import { WORK_PATH } from '@/globalConfig';
import { uuid } from '@/utils';
import { getWorkspacePaths, executeCommand } from '@/utils/vscode';
import type { Api } from '@alova/wormhole';
import { Worker } from 'worker_threads';

type MessageCallBack<T> = (data?: any) => T | Promise<T>;
export interface Task {
  type: string;
  payload: {
    resolve: (data: any) => void;
    reject: (reason: any) => void;
  };
}
export default class AlovaWork {
  private alovaWork: Worker;

  private taskMap = new Map<string, Task>();

  constructor() {
    this.alovaWork = new Worker(WORK_PATH);
    this.alovaWork.on('message', async ({ type, id, payload }) => {
      switch (type) {
        case 'readConfig':
        case 'generate':
        case 'generateConfig':
        case 'getApis': {
          this.doneTask(id, type, payload);
          break;
        }
        case 'executeCommand': {
          this.doneTask(id, type, payload, data => {
            const { cmd = '', args = [] } = data ?? {};
            executeCommand(cmd, ...args);
          });
          break;
        }
        case 'log': {
          this.doneTask(id, type, payload, data => log(...data));
          break;
        }
        default: {
          console.log(type, payload);
        }
      }
    });
  }

  private async setTask<U, T = any>(type: string, cb: MessageCallBack<T>) {
    let data: any;
    let error: any;
    try {
      data = await cb();
    } catch (err) {
      error = err;
    }
    return new Promise<U>((resolve, reject) => {
      if (!data && error) {
        reject(error);
        return;
      }
      const taskId = uuid();
      this.postMessage(taskId, type, () => data);
      this.taskMap.set(taskId, { type, payload: { resolve, reject } });
    });
  }

  private async doneTask<T>(id: string, type: string, payload: any, cb?: MessageCallBack<T>) {
    let { data, error } = payload ?? {};
    if (cb) {
      try {
        data = await cb(data);
      } catch (err) {
        error = err;
      }
    }
    if (!this.taskMap.has(id)) {
      return;
    }
    const task = this.taskMap.get(id) as Task;
    if (task.type === type) {
      if (!data && error) {
        task.payload.reject(error);
      } else {
        task.payload.resolve(data);
      }
    }
    this.taskMap.delete(id);
  }

  private async postMessage<T>(id: string | null, type: string, cb: MessageCallBack<T>) {
    let data: any;
    let error: any;
    try {
      data = await cb();
    } catch (err) {
      error = err;
    }
    if (!data && error) {
      return;
    }
    this.alovaWork.postMessage({
      type,
      id,
      payload: data
    });
  }

  generate(force = false, projectPath?: string) {
    return this.setTask<{
      resultArr: Array<[string, boolean]>;
      errorArr: Array<[string, any]>;
    }>('generate', () => ({
      force,
      projectPath
    }));
  }

  async readConfig(isShowError = false, projectPath?: string | string[]) {
    const hasConfig = await this.setTask<boolean>('readConfig', () => [projectPath ?? getWorkspacePaths()].flat());
    if (!hasConfig && isShowError) {
      throw new Error('Expected to create alova.config.js in root directory.');
    }
  }

  getApis(filePath: string) {
    return this.setTask<Api[]>('getApis', () => filePath);
  }

  generateConfig() {
    return this.setTask<void>('generateConfig', () => getWorkspacePaths());
  }
}
export const alovaWork = new AlovaWork();
