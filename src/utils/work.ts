import type { CommandKey } from '@/commands';
import type { Task } from '@/helper/work';
import importFresh from 'import-fresh';
import path from 'node:path';
import { parentPort } from 'worker_threads';
import { uuid } from '.';
import { TASK_MAP } from '../work/config';

type MessageCallBack<T> = () => T | Promise<T>;
export async function postMessage<T>(id: string | null, type: string, cb: MessageCallBack<T>) {
  let data: any;
  let error: any;
  try {
    data = await cb();
  } catch (err) {
    error = err;
  }
  parentPort?.postMessage({
    type,
    payload: { data, error },
    id
  });
}
export async function doneTask<T>(id: string | null, type: string, cb: MessageCallBack<T>) {
  let data: any;
  let error: any;
  try {
    data = await cb();
  } catch (err) {
    error = err;
  }
  if (id && TASK_MAP.has(id)) {
    const task = TASK_MAP.get(id) as Task;
    if (task.type === type) {
      if (!data && error) {
        task.payload.reject(error);
      } else {
        task.payload.resolve(data);
      }
    }
    TASK_MAP.delete(id);
  }
}
export async function setTask<U, T = any>(type: string, cb: MessageCallBack<T>) {
  return new Promise<U>((resolve, reject) => {
    const taskId = uuid();
    postMessage(taskId, type, cb);
    TASK_MAP.set(taskId, { type, payload: { resolve, reject } });
  });
}
export function executeCommand(cmd: CommandKey) {
  return postMessage(null, 'executeCommand', () => cmd);
}

export const getTypescriptByWorkspace = async (workspaceRootPathArr: string[]) => {
  let typescript: typeof import('typescript') | null = null;
  for (const workspaceRootPath of workspaceRootPathArr) {
    try {
      typescript = importFresh(path.join(workspaceRootPath, './node_modules/typescript'));
    } catch (error) {}
  }
  return typescript;
};
export function getWorkspaceRootPathArr() {
  return setTask<string[]>('workspaceRootPathArr', () => {});
}
export async function getTypescript() {
  return getTypescriptByWorkspace(await getWorkspaceRootPathArr());
}
export async function log(...args: any[]) {
  return postMessage(null, 'log', () => args);
}
