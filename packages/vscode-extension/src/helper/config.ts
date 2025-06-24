import type { Config, TemplateData } from '@alova/wormhole';

export type ConfigObject = [string, Config];
export const CONFIG_POOL: Array<ConfigObject> = [];
export const TEMPLATE_DATA: Map<string, TemplateData> = new Map();
export const ON_CONFIG_CHANGE: Array<() => void> = [];
export const waitConfigChange = () =>
  new Promise<void>(resolve => {
    ON_CONFIG_CHANGE.push(resolve);
  });
