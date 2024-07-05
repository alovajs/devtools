import { uuid } from '@/utils';
import path from 'node:path';
import { Worker } from 'worker_threads';

interface Task {
  type: string;
  id: string;
  payload: {
    resolve: (data: any) => void;
    reject: (reason: any) => void;
  };
}
export default class AlovaWork {
  private alovaWork: Worker;

  private taskArr: Task[] = [];

  constructor() {
    this.alovaWork = new Worker(path.join(__dirname, '/work.js'));
    this.alovaWork.on('message', async ({ type, id, payload }) => {
      const task = this.taskArr.find(task => task.id === id);
      if (!task) {
        return;
      }
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
      const idx = this.taskArr.findIndex(item => item.id === task.id);
      if (idx >= 0) {
        this.taskArr.splice(idx, 1);
      }
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
      this.taskArr.push({ type: 'import', id: taskId, payload: { resolve, reject } });
    });
  }
}
export const alovaWork = new AlovaWork();
