// Used to generate alova.config.js
import generateConfig from '@/functions/generateConfig';
import { getCurrentDirectory } from '@/utils/vscode';
import { Commands } from './commands';

export default <CommandType>{
  commandId: Commands.create_config,
  handler: () => async () => {
    generateConfig(getCurrentDirectory());
  }
};
