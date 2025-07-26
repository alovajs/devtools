import type { MessageReceiver, MessageSender } from '@jsonrpc-rx/client'
import type { DataType, HandlersType, MessageType } from '@/handlers'
import { JsonrpcClient, wrap } from '@jsonrpc-rx/client'
import { getVscodeApi } from '~/utils/vscode'

// 消息发送者：给 extension 发送消息
const msgSender: MessageSender = message =>
  getVscodeApi()?.postMessage(message)
// 消息接收者：接受消息，不一定来自 extension，但是 jsonrpc-rx 会自动鉴别
const msgReceiver: MessageReceiver = handler =>
  globalThis?.addEventListener?.('message', ({ data }) => {
    if (typeof data === 'string') {
      handler(data)
    }
  })

// 初始化一个 Jsonrpc 的“客户端”，与 extension 的“服务端”对应
const jsonrpcClient = new JsonrpcClient(msgSender, msgReceiver)

export const useHandlers = () => wrap<HandlersType>(jsonrpcClient)

export type { DataType, MessageType }

export { MType } from '@/handlers/constant'
