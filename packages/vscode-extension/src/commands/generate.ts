import { showError } from '@/components/event';
import { endLoading, loading } from '@/components/statusBar';
import ApiGenerate from '@/core/ApiGenerate';
import { registerCommand } from '@/utils/vscode';
import { Commands } from './commands';

export const refresh: CommandType = {
  commandId: Commands.refresh,
  handler: () => async () => {
    try {
      loading();
      await ApiGenerate.readConfig();
      ApiGenerate.checkConfig();
      // Generate api file
      await ApiGenerate.generate({ force: true });
      ApiGenerate.showError();
    } catch (error) {
      showError(error);
    } finally {
      endLoading();
      ApiGenerate.clear();
    }
  }
};

export const generateApi: CommandType<[string]> = {
  commandId: Commands.generate_api,
  handler: () => async projectPath => {
    try {
      await ApiGenerate.readConfig(projectPath);
      // Generate api file
      await ApiGenerate.generate({ projectPath });
      ApiGenerate.showError();
    } catch (error) {
      showError(error);
    } finally {
      ApiGenerate.clear();
    }
  }
};

export const createConfig: CommandType = {
  commandId: Commands.create_config,
  handler: () => () => ApiGenerate.createConfig()
};

export default <ExtensionModule>function (ctx) {
  return [registerCommand(refresh, ctx), registerCommand(generateApi, ctx), registerCommand(createConfig, ctx)];
};
