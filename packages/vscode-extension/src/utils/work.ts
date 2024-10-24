import type { CommandKey } from '@/commands';
import type { Task } from '@/helper/work';
import { parentPort } from 'worker_threads';
import { uuid } from '.';
import { TASK_MAP } from '../work/config';
import AlovaError from '@/components/error';

type MessageCallBack<T> = () => T | Promise<T>;
export function createError(err: AlovaError) {
  return {
    message: err.message,
    stack: err.stack,
    ERROR_CODE: err.ERROR_CODE
  } as AlovaError;
}
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
export function executeCommand<T extends any[]>(cmd: CommandKey, ...args: T) {
  return postMessage(null, 'executeCommand', () => ({
    cmd,
    args
  }));
}

export function getWorkspaceRootPathArr() {
  return setTask<string[]>('workspaceRootPathArr', () => {});
}

export async function log(...args: any[]) {
  return postMessage(null, 'log', () => args);
}
