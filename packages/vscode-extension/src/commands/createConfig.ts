// 用于自动生成alova.config.js
import { alovaWork } from '@/helper/work';

export default {
  commandId: 'alova.create.config',
  handler: () => async () => {
    alovaWork.generateConfig();
  }
} as Commonand;
