import type { GeneratorProgressEvent } from 'worma'
import path from 'node:path'
import { ProgressLocation, window } from 'vscode'
import { showError } from '@/components/event'
import ApiGenerate from '@/core/ApiGenerate'
import worma from '@/helper/worma'
import { getWorkspacePaths, registerCommand } from '@/utils/vscode'
import { Commands } from './commands'
import { endLoading, loading } from './statusBar'

interface ActionItem {
  label: string
  action: 'createConfig' | 'generateApis'
}

interface ProjectItem {
  label: string
  description?: string
  projectPath: string | 'all'
  picked?: boolean
}

async function resolveProjectPaths(): Promise<string[]> {
  const workspacePaths = getWorkspacePaths()
  const results = await Promise.allSettled(
    workspacePaths.map(wp => worma.resolveWorkspaces(wp)),
  )
  const dirs = results
    .filter((r): r is PromiseFulfilledResult<string[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
  return [...new Set(dirs)]
}

async function pickProject(projects: string[]): Promise<string[] | undefined> {
  if (projects.length <= 1) {
    return projects
  }
  // 将绝对路径转为相对于 workspace 根目录的相对路径显示
  const workspaceRoots = getWorkspacePaths()
  function toLabel(p: string): string {
    for (const root of workspaceRoots) {
      const rel = path.relative(root, p)
      if (rel && !rel.startsWith('..'))
        return rel || path.basename(p)
    }
    return path.basename(p)
  }
  const items: ProjectItem[] = [
    { label: 'All', description: 'Run in all projects', projectPath: 'all', picked: true },
    ...projects.map(p => ({ label: toLabel(p), projectPath: p })),
  ]
  const picked = await window.showQuickPick(items, {
    title: 'Select project',
    placeHolder: 'Choose which project to run in',
  })
  if (!picked) {
    return undefined
  }
  return picked.projectPath === 'all' ? projects : [picked.projectPath]
}

export const showStatusBarActions: CommandType = {
  commandId: Commands.status_bar_show_actions,
  handler: () => async () => {
    const actions: ActionItem[] = [
      { label: '$(zap) Generate APIs', action: 'generateApis' },
      { label: '$(new-file) Create config file', action: 'createConfig' },
    ]

    const picked = await window.showQuickPick(actions, {
      title: 'Worma',
      placeHolder: 'Select an action',
    })
    if (!picked) {
      return
    }

    const allProjects = await resolveProjectPaths()
    const targetProjects = await pickProject(allProjects)
    if (!targetProjects) {
      return
    }

    if (picked.action === 'createConfig') {
      for (const projectPath of targetProjects) {
        try {
          await worma.createConfig({ projectPath })
        }
        catch (error) {
          showError(error)
        }
      }
    }
    else {
      try {
        loading()
        await ApiGenerate.readConfig(targetProjects.length === allProjects.length ? undefined : targetProjects)
        ApiGenerate.checkConfig()
        const projectPath = targetProjects.length === 1 ? targetProjects[0] : undefined
        await window.withProgress(
          {
            location: ProgressLocation.Notification,
            title: 'Generating APIs',
            cancellable: false,
          },
          async (progress) => {
            await ApiGenerate.generate({
              force: false,
              projectPath,
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
    }
  },
}

export default <ExtensionModule> function (ctx) {
  return [registerCommand(showStatusBarActions, ctx)]
}
