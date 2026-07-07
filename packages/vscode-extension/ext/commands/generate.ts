import type { GeneratorProgressEvent } from 'wormajs'
import { ProgressLocation, window } from 'vscode'
import { endLoading, loading } from '@/commands/statusBar'
import { showError } from '@/components/event'
import ApiGenerate from '@/core/ApiGenerate'
import { registerCommand } from '@/utils/vscode'
import { Commands } from './commands'

export const refresh: CommandType = {
  commandId: Commands.refresh,
  handler: () => async () => {
    try {
      loading()
      await ApiGenerate.readConfig()
      ApiGenerate.checkConfig()
      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: 'Generating APIs',
          cancellable: false,
        },
        async (progress) => {
          await ApiGenerate.generate({
            force: false,
            onProgress(event: GeneratorProgressEvent) {
              if (event.phase !== 'progress')
                return
              progress.report({
                message: `[${event.source ?? 'core'}] ${event.progress}%${event.message ? ` ${event.message}` : ''}`,
              })
            },
          })
        },
      )
      ApiGenerate.showError()
    }
    catch (error) {
      showError(error)
    }
    finally {
      endLoading()
      ApiGenerate.clear()
    }
  },
}

export const generateApi: CommandType<[string]> = {
  commandId: Commands.generate_api,
  handler: () => (projectPath: string) => callGenerateApi(projectPath, false),
}

export const generateApiForce: CommandType<[string]> = {
  commandId: Commands.generate_api_force,
  handler: () => (projectPath: string) => callGenerateApi(projectPath, true),
}

async function callGenerateApi(projectPath: string, force: boolean) {
  try {
    await ApiGenerate.readConfig(projectPath)
    await ApiGenerate.generate({ projectPath, force })
    ApiGenerate.showError()
  }
  catch (error) {
    showError(error)
  }
  finally {
    ApiGenerate.clear()
  }
}

export const createConfig: CommandType = {
  commandId: Commands.create_config,
  handler: () => () => ApiGenerate.createConfig(),
}

export default <ExtensionModule> function (ctx) {
  return [registerCommand(refresh, ctx), registerCommand(generateApi, ctx), registerCommand(generateApiForce, ctx), registerCommand(createConfig, ctx)]
}
