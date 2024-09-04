import generate from '@/work/generate';
import generateConfig from '@/work/generateConfig';
import getApis from '@/work/getApis';
import readConfig from '@/work/readConfig';
import { parentPort } from 'worker_threads';
import './globalConfig';
import { doneTask, postMessage } from './utils/work';
/**
 * work子线程，用来处理主线程不能处理的东西，不能引入vscode模块
 */
parentPort?.on('message', async ({ id, type, payload }) => {
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
      doneTask(id, type, () => payload);
      break;
    }
    case 'generateConfig': {
      postMessage(id, type, () => generateConfig(payload));
      break;
    }
    default: {
      console.log(type, payload);
    }
  }
});
