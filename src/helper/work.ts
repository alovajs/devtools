import { commandsMap } from '@/commands';
import { WORK_PATH } from '@/globalConfig';
import { uuid } from '@/utils';
import type { Api } from '@alova/wormhole';
import * as vscode from 'vscode';
import { Worker } from 'worker_threads';

export interface Task {
  type: string;
  payload: {
    resolve: (data: any) => void;
    reject: (reason: any) => void;
  };
}
function toVscodeHelper(alovaWork: Worker, type: string, payload: any) {
  switch (type) {
    case 'executeCommand': {
      const { data } = payload;
      const commandId = commandsMap[data as keyof typeof commandsMap]?.commandId;
      if (commandId) {
        vscode.commands.executeCommand(commandId);
      }
      break;
    }
    case 'workspaceRootPathArr': {
      const workspaceFolders = vscode.workspace.workspaceFolders || [];
      const { data } = payload;
      alovaWork.postMessage({
        type: 'workspaceRootPathArr',
        taskId: data,
        payload: workspaceFolders.map(item => `${item.uri.fsPath}/`)
      });
      break;
    }
    default: {
      console.log(type, payload);
    }
  }
}
export default class AlovaWork {
  private alovaWork: Worker;

  private taskMap = new Map<string, Task>();

  constructor() {
    this.alovaWork = new Worker(WORK_PATH);
    this.alovaWork.on('message', async ({ type, id, payload }) => {
      if (!this.taskMap.has(id)) {
        toVscodeHelper(this.alovaWork, type, payload);
        return;
      }
      const task = this.taskMap.get(id) as Task;
      switch (type) {
        case 'readConfig': {
          const { data, error } = payload;
          if (!data && error) {
            task.payload.reject(error);
          } else {
            task.payload.resolve(data);
          }
          break;
        }
        case 'generate': {
          const { data, error } = payload;
          if (!data && error) {
            task.payload.reject(error);
          } else {
            task.payload.resolve(data);
          }
          break;
        }
        case 'getApis': {
          const { data, error } = payload;
          if (!data && error) {
            task.payload.reject(error);
          } else {
            task.payload.resolve(data);
          }
          break;
        }
        default: {
          console.log(type, payload);
        }
      }
      this.taskMap.delete(id);
    });
    this.alovaWork.on('error', error => {
      console.log(error, 47);
    });
  }

  generate(force = false) {
    return new Promise<{
      resultArr: Array<[string, boolean]>;
      errorArr: Array<[string, any]>;
    }>((resolve, reject) => {
      const taskId = uuid();
      this.alovaWork.postMessage({
        type: 'generate',
        id: taskId,
        payload: force
      });
      this.taskMap.set(taskId, { type: 'generate', payload: { resolve, reject } });
    });
  }

  readConfig() {
    return new Promise((resolve, reject) => {
      const taskId = uuid();
      const workspaceFolders = vscode.workspace.workspaceFolders || [];
      this.alovaWork.postMessage({
        type: 'readConfig',
        id: taskId,
        payload: workspaceFolders.map(item => `${item.uri.fsPath}/`)
      });
      this.taskMap.set(taskId, { type: 'readConfig', payload: { resolve, reject } });
    });
  }

  getApis(filePath: string) {
    return new Promise<Api[]>((resolve, reject) => {
      const taskId = uuid();
      this.alovaWork.postMessage({
        type: 'getApis',
        id: taskId,
        payload: filePath
      });
      this.taskMap.set(taskId, { type: 'getApis', payload: { resolve, reject } });
    });
  }
}
export const alovaWork = new AlovaWork();
