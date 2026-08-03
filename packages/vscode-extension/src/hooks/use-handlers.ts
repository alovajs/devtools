import type { MessageReceiver, MessageSender } from '@jsonrpc-rx/client'
import type { DataType, HandlersType, MessageType } from '#/handlers'
import { JsonrpcClient, wrap } from '@jsonrpc-rx/client'
import { getVscodeApi } from '~/utils/vscode'

// message sender: sends messages to the extension
const msgSender: MessageSender = message =>
  getVscodeApi()?.postMessage(message)
// message receiver: receives messages (not necessarily from the extension; jsonrpc-rx identifies them automatically)
const msgReceiver: MessageReceiver = handler =>
  globalThis?.addEventListener?.('message', ({ data }) => {
    if (typeof data === 'string') {
      handler(data)
    }
  })

// initialize a Jsonrpc "client" that pairs with the extension's "server"
const jsonrpcClient = new JsonrpcClient(msgSender, msgReceiver)

export const useHandlers = () => wrap<HandlersType>(jsonrpcClient)

export type { DataType, MessageType }

export { MType } from '#/constant'
