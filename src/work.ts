import { loadEsmModule } from '@/utils/work';
import serialize from 'serialize-javascript';
import { parentPort } from 'worker_threads';

/**
 * work子线程，用来处理主线程不能处理的东西，不能引入vscode模块
 */
parentPort?.on('message', async ({ type, payload, id }) => {
  switch (type) {
    // 支持动态imort esm
    case 'import': {
      let data: any;
      let error: any;
      try {
        data = serialize(await loadEsmModule<any>(payload));
      } catch (err) {
        error = err;
      }
      parentPort?.postMessage({
        type,
        payload: { data, error },
        id
      });
      break;
    }
    default: {
      console.log(type, payload);
    }
  }
});
