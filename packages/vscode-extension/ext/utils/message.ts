import { MessageService } from '@/service/message.service'

const MESSAGE_CHANNEL = 'ext-server'
const REACT_MESSAGE_CHANNEL = 'view-app'

export interface DataType<T = any> {
  type: string
  data: T
}

export interface MessageType<T = any> {
  from?: string
  value?: DataType<T>
}

export const messageService = new MessageService()

export function register() {
  messageService.register(MESSAGE_CHANNEL)
}

export function unregister() {
  messageService.unregister(MESSAGE_CHANNEL)
}

export function sendMessage<T>(msg: DataType<T>) {
  return messageService.sendMessage(REACT_MESSAGE_CHANNEL, {
    value: msg,
    from: MESSAGE_CHANNEL,
  } as MessageType)
}

export function onMessage(listener: (msg: DataType) => void) {
  return messageService.addMessageListener(
    MESSAGE_CHANNEL,
    (msg: MessageType) => {
      const { value, from } = msg ?? {}
      if (from === REACT_MESSAGE_CHANNEL) {
        listener(
          value ?? {
            type: 'empty',
            data: value,
          },
        )
      }
    },
  )
}

export function offMessage(id: number) {
  messageService.rmMessageListener(MESSAGE_CHANNEL, id)
}

export function onOnceMessage(listener: (msg: DataType) => void) {
  let listenerId = 0
  onMessage((msg) => {
    offMessage(listenerId)
    listener(msg)
  }).then((id) => {
    listenerId = id
  })
}

export function sendAndReceiveMessage<T extends DataType>(msg: DataType) {
  return new Promise<T>((resolve) => {
    onOnceMessage((msg) => {
      resolve(msg as T)
    })
    sendMessage(msg)
  })
}
