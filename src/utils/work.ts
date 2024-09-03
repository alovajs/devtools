import type { CommandKey } from '@/commands';
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
  return new Promise<string[]>((resolve, reject) => {
    const taskId = uuid();
    postMessage(null, 'workspaceRootPathArr', () => taskId);
    TASK_MAP.set(taskId, { type: 'workspaceRootPathArr', payload: { resolve, reject } });
  });
}
export async function getTypescript() {
  return getTypescriptByWorkspace(await getWorkspaceRootPathArr());
}
