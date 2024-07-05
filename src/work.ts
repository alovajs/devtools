import { loadEsmModule } from '@/utils';
import { parentPort } from 'worker_threads';

parentPort?.on('message', async ({ type, payload, id }) => {
  switch (type) {
    // 支持动态imort esm
    case 'import': {
      let data: any;
      let error: any;
      try {
        data = JSON.parse(JSON.stringify(await loadEsmModule<any>(payload)));
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
