import type { Task } from '@/helper/work';
import type { Config } from '@alova/wormhole';

export type ConfigObject = [string, Config];
export const TASK_MAP = new Map<string, Task>();
export const CONFIG_POOL: Array<ConfigObject> = [];
export default {
  CONFIG_POOL
};
