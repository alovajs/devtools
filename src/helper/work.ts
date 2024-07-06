import { WORK_PATH } from '@/globalConfig';
import { uuid } from '@/utils';
import { Worker } from 'worker_threads';

interface Task {
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
      if (!this.taskMap.has(id)) {
        return;
      }
      const task = this.taskMap.get(id) as Task;
      switch (type) {
        case 'import': {
          const { data, error } = payload;
          if (!data) {
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

  importEsmModule<T>(modulePath: string | URL) {
    return new Promise<T>((resolve, reject) => {
      const taskId = uuid();
      this.alovaWork.postMessage({
        type: 'import',
        id: taskId,
        payload: modulePath
      });
      this.taskMap.set(taskId, { type: 'import', payload: { resolve, reject } });
    });
  }
}
export const alovaWork = new AlovaWork();
