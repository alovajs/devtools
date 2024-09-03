import generate from '@/work/generate';
import getApis from '@/work/getApis';
import readConfig from '@/work/readConfig';
import { parentPort } from 'worker_threads';
import './globalConfig';
import type { Task } from './helper/work';
import { postMessage } from './utils/work';
import { TASK_MAP } from './work/config';
/**
 * work子线程，用来处理主线程不能处理的东西，不能引入vscode模块
 */
parentPort?.on('message', async ({ type, payload, id, taskId }) => {
  switch (type) {
    case 'readConfig': {
      postMessage(id, type, () => readConfig(payload));
      break;
    }
    case 'generate': {
      postMessage(id, type, () => generate(payload));
      break;
    }
    case 'getApis': {
      postMessage(id, type, () => getApis(payload));
      break;
    }
    case 'workspaceRootPathArr': {
      if (TASK_MAP.has(taskId)) {
        const task = TASK_MAP.get(taskId) as Task;
        task.payload.resolve(payload);
        TASK_MAP.delete(taskId);
      }
      break;
    }
    default: {
      console.log(type, payload);
    }
  }
});
