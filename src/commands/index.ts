import autocomplete from './autocomplete';
import generateApi from './generateApi';
import refresh from './refresh';
import setup from './setup';
import showStatusBarIcon from './showStatusBarIcon';

export const commands = [setup, autocomplete, generateApi, refresh, showStatusBarIcon];
export const commandsMap = {
  setup,
  autocomplete,
  generateApi,
  refresh,
  showStatusBarIcon
};
export type CommandKey = keyof typeof commandsMap;
