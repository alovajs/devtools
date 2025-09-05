import type { Api } from '@alova/wormhole'
import type { ExtensionContext } from 'vscode'
import { MType } from '#/constant'
import { isApiExists } from '@/functions/getApis'
import { Log } from '@/utils'
import {
  onMessage,
  register,
  sendAndReceiveMessage,
  sendMessage,
  unregister,
} from '@/utils/message'
import { focusView } from '@/utils/vscode'

export default class VscodeClient {
  private static methods = new Map<string, (data: any) => void>()
  static init(_context: ExtensionContext) {
    register()
    onMessage(({ type, data }) => {
      this.methods.get(type)?.(data)
    })
  }

  static sayHello(data: string) {
    return sendAndReceiveMessage({ type: MType.hello, data })
  }

  static refreshDocs() {
    sendMessage({
      type: MType.refreshDocs,
      data: null,
    })
  }

  static openDocs(url: string) {
    sendMessage({
      type: MType.openDocs,
      data: url,
    })
  }

  static openApiDetail(api: Api) {
    sendMessage({
      type: MType.openApiDetail,
      data: api,
    })
  }

  static deactivate() {
    unregister()
  }

  static createMethod<T = any>(type: string, method: (data: T) => void) {
    this.methods.set(type, method)
  }
}

VscodeClient.createMethod<string>(MType.hello, (msg) => {
  Log.info(msg, {
    prompt: true,
  })
  VscodeClient.sayHello(`good !! 💖😁😂 ${msg}${Date.now()}`)
})

VscodeClient.createMethod<Api | null>(MType.openDocs, (api) => {
  if (api) {
    focusView('api-docs-detail-view')
    VscodeClient.openApiDetail(api)
  }
})

VscodeClient.createMethod<Api | null>(MType.checkApiExists, async (api) => {
  sendMessage({
    type: MType.checkApiExists,
    data: await isApiExists(api),
  })
})
