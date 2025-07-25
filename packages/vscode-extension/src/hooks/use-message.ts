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

function sendAndReceive<T = unknown>(channel: string, value: DataType<any>) {
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
  listener: (value?: DataType<any>, from?: string) => void,
) {
  const id = await handlers.addMessageListener(
    MESSAGE_CHANNEL,
    (msg: MessageType<any>) => {
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

export function useVscodeMessage() {
  return {
    on,
    onType,
    onMessage,
    sendMessage,
    sendAndReceive,
    onVscode: <T = unknown>(listener: (value: DataType<T>) => void) =>
      on<T>(REACT_MESSAGE_CHANNEL, listener),
    onVscodeType: <T = unknown>(type: string, listener: (value: T) => void) =>
      onType<T>(REACT_MESSAGE_CHANNEL, type, listener),
    sendAndReceiveToVscode: <T = unknown>(value: DataType) =>
      sendAndReceive<T>(REACT_MESSAGE_CHANNEL, value),
    sendMessageToVscode: <T = any>(value: DataType<T>) =>
      sendMessage<T>(REACT_MESSAGE_CHANNEL, value),
  }
}

export { MType } from './use-handlers'
