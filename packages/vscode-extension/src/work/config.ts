import type { Task } from '@/helper/work';
import type { Configuration } from '@alova/wormhole';

export const TASK_MAP = new Map<string, Task>();
export const CONFIG_POOL: Array<Configuration> = [];
export default {
  CONFIG_POOL
};
