import type { DataType, MessageType } from './use-handlers'
import { useHandlers } from './use-handlers'

const MESSAGE_CHANNEL = 'view-app'
const REACT_MESSAGE_CHANNEL = 'ext-server'

const handlers = useHandlers()
// 注册一个 channel
handlers.registerChannel(MESSAGE_CHANNEL)

// 发送消息
function sendMessage<T = any>(channel: string, value: DataType<T>) {
  const msgBody: MessageType<T> = {
    from: MESSAGE_CHANNEL,
    value,
  }
  return handlers.sendMessage(channel, msgBody)
}

function sendAndReceive<T = unknown>(channel: string, value: DataType) {
  return new Promise<DataType<T>>((resolve) => {
    let rmListener = () => {}
    on<T>(channel, (data) => {
      rmListener()
      resolve(data)
    }).then((listener) => {
      rmListener = listener
    })
    sendMessage(channel, value)
  })
}
async function onMessage(
  listener: (value?: DataType, from?: string) => void,
) {
  const id = await handlers.addMessageListener(
    MESSAGE_CHANNEL,
    (msg: MessageType) => {
      const { value, from } = msg ?? {}
      listener(value, from)
    },
  )
  handlers.readyMessageListener(MESSAGE_CHANNEL, id)
  const rmListener = () => {
    handlers.rmMessageListener(MESSAGE_CHANNEL, id)
  }

  onUnmounted(() => {
    rmListener()
  })

  return rmListener
}

async function on<T = unknown>(
  channel: string,
  listener: (value: DataType<T>) => void,
) {
  return onMessage((value, form) => {
    if (form === channel && value) {
      listener(value)
    }
  })
}

async function onType<T = unknown>(
  channel: string,
  type: string,
  listener: (value: T) => void,
) {
  return on<T>(channel, ({ type: receiveType, data }) => {
    if (receiveType === type) {
      listener(data)
    }
  })
}
async function onVscode<T = unknown>(listener: (value: DataType<T>) => void) {
  return on<T>(REACT_MESSAGE_CHANNEL, listener)
}

async function onVscodeType<T = unknown>(type: string, listener: (value: T) => void) {
  return onType<T>(REACT_MESSAGE_CHANNEL, type, listener)
}

async function sendAndReceiveToVscode<T = unknown>(value: DataType) {
  return sendAndReceive<T>(REACT_MESSAGE_CHANNEL, value)
}
async function sendMessageToVscode<T = any>(value: DataType<T>) {
  return sendMessage<T>(REACT_MESSAGE_CHANNEL, value)
}
export function useVscodeMessage() {
  return {
    on,
    onType,
    onMessage,
    sendMessage,
    sendAndReceive,
    onVscode,
    onVscodeType,
    sendAndReceiveToVscode,
    sendMessageToVscode,
  }
}

export { MType } from './use-handlers'
