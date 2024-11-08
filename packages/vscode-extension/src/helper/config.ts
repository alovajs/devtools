import type { Config, TemplateData } from '@alova/wormhole';

export type ConfigObject = [string, Config];
export const CONFIG_POOL: Array<ConfigObject> = [];
export const TEMPLATE_DATA: Map<string, TemplateData> = new Map();
