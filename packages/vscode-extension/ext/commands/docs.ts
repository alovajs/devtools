import type { ApiRef } from '~/types'
import { window } from 'vscode'
import VscodeClient from '@/core/VscodeClient'
import { Log } from '@/utils'
import { expandView, registerCommand } from '@/utils/vscode'
import { Commands } from './commands'

export class AppiDocs {
  static async openDocs(apiRefs: ApiRef[] | string) {
    let selectedRef: ApiRef | undefined

    // 兼容旧格式 (string key)
    if (typeof apiRefs === 'string') {
      Log.info(`Open docs: ${apiRefs}`)
      expandView('api-docs-sidebar')
      VscodeClient.openDocs(apiRefs)
      return
    }

    // 新格式: ApiRef[]
    if (apiRefs.length === 0)
      return
    if (apiRefs.length === 1) {
      // 只有一个来源，直接打开
      selectedRef = apiRefs[0]
    }
    else {
      // 多个来源，弹出 QuickPick 让用户选择
      const items = apiRefs.map(ref => ({
        label: `${ref.method.toUpperCase()} ${ref.path}`,
        description: ref.summary ?? '',
        detail: `${ref.serverName} (${ref.serverPath})`,
        ref,
      }))
      const picked = await window.showQuickPick(items, {
        placeHolder: 'Select API source to view documentation',
        matchOnDescription: true,
        matchOnDetail: true,
      })
      if (!picked)
        return
      selectedRef = picked.ref
    }

    Log.info(`Open docs: ${selectedRef.uniqueKey}`)
    expandView('api-docs-sidebar')
    VscodeClient.openDocs(selectedRef.uniqueKey)
  }

  static async refreshDocs() {
    Log.info(`Refresh docs`)
  }
}
export const openDocs: CommandType<[ApiRef[] | string]> = {
  commandId: Commands.api_docs_open,
  handler: () => async (apiRefs: ApiRef[] | string) => {
    AppiDocs.openDocs(apiRefs)
  },
}
export const refreshDocs: CommandType = {
  commandId: Commands.api_docs_refresh,
  handler: () => () => {
    VscodeClient.refreshDocs()
  },
}
export default <ExtensionModule> function (ctx) {
  return [registerCommand(openDocs, ctx), registerCommand(refreshDocs, ctx)]
}
