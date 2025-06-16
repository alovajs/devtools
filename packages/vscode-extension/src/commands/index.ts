import autocomplete from './autocomplete';
import createConfig from './createConfig';
import generateApi from './generateApi';
import openDocs from './openDocs';
import refresh from './refresh';
import setup from './setup';
import showStatusBarIcon from './showStatusBarIcon';

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
