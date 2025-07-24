import { Log } from '@/utils'

export class MessageService {
  private channelListenerMap = new Map<
    string,
    Map<number, (value: any) => void>
  >()

  private listenerNumber = 0
  private preMessages = new Map<string, any[]>()
  register(channel: string) {
    if (!this.channelListenerMap.has(channel)) {
      this.channelListenerMap.set(channel, new Map())
    }
  }

  unregister(channel: string) {
    return this.channelListenerMap.delete(channel)
  }

  sendMessage(channel: string, message: any): Promise<string | void> {
    if (!this.channelListenerMap.has(channel)) {
      this.register(channel)
    }
    if (!this.preMessages.has(channel)) {
      this.preMessages.set(channel, [])
    }
    const listeners = this.channelListenerMap.get(channel)!
    if (!listeners.size) {
      this.preMessages.get(channel)!.push(message)
      return Promise.resolve()
    }
    for (const [_, listener] of listeners) {
      listener.call({}, message)
    }
    return Promise.resolve()
  }

  addMessageListener(channel: string, listener: (msg: any) => void) {
    if (!this.channelListenerMap.has(channel)) {
      this.register(channel)
    }
    const listeners = this.channelListenerMap.get(channel)!
    listeners.set(++this.listenerNumber, listener)
    return Promise.resolve(this.listenerNumber)
  }

  readyMessageListener(channel: string, listenerNumber: number) {
    Log.info(`${channel} ready`)
    const listeners = this.channelListenerMap.get(channel)!
    const preMessages = this.preMessages.get(channel)
    if (preMessages?.length) {
      preMessages.forEach((message) => {
        for (const [id, listener] of listeners) {
          if (id === listenerNumber) {
            listener.call({}, message)
          }
        }
      })
    }
    return Promise.resolve()
  }

  rmMessageListener(channel: string, listenerNumber: number) {
    if (!this.channelListenerMap.has(channel)) {
      return false
    }
    const listeners = this.channelListenerMap.get(channel)!
    if (listeners.size < 2) {
      this.preMessages.delete(channel)
    }
    return listeners.delete(listenerNumber)
  }
}
