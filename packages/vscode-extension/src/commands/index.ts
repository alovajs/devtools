import autocomplete from './autocomplete';
import createConfig from './createConfig';
import generateApi from './generateApi';
import refresh from './refresh';
import setup from './setup';
import showStatusBarIcon from './showStatusBarIcon';

export const commandsMap = {
  setup,
  autocomplete,
  generateApi,
  refresh,
  createConfig,
  showStatusBarIcon
};
export const commands = Object.values(commandsMap);
export type CommandKey = keyof typeof commandsMap;
