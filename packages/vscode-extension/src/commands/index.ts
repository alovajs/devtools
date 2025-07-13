import autocomplete from './autocomplete';
import createConfig from './createConfig';
import { generateApi, refresh } from './generate';
import openDocs from './openDocs';
import setup from './setup';
import showStatusBarIcon from './showStatusBarIcon';

export * from './commands';
export const commandsMap = {
  setup,
  autocomplete,
  generateApi,
  refresh,
  createConfig,
  showStatusBarIcon,
  openDocs
};
export const commands = Object.values(commandsMap);
export type CommandKey = keyof typeof commandsMap;
