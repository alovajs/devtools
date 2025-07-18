import type { MessageReceiver, MessageSender } from '@jsonrpc-rx/client'
import type { HandlersType } from 'alova-vscode-extension/handlers'
import { JsonrpcClient, wrap } from '@jsonrpc-rx/client'

const vscodeApi = (globalThis as any).acquireVsCodeApi?.()

// 消息发送者：给 extension 发送消息
const msgSender: MessageSender = vscodeApi?.postMessage.bind(vscodeApi) ?? (() => {})
// 消息接收者：接受消息，不一定来自 extension，但是 jsonrpc-rx 会自动鉴别
const msgReceiver: MessageReceiver = handler => globalThis.addEventListener?.('message', evt => handler(evt.data))

// 初始化一个 Jsonrpc 的“客户端”，与 extension 的“服务端”对应
const jsonrpcClient = new JsonrpcClient(msgSender, msgReceiver)

export const useHandlers = () => wrap<HandlersType>(jsonrpcClient)
