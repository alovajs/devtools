export function highPrecisionInterval(callback: () => void, intervalInMilliseconds: number, immediate = false) {
  let isRunning = true
  if (immediate) {
    callback()
  }
  const MAX_TIME = 2147483648
  const timer = setInterval(callback, Math.min(MAX_TIME, intervalInMilliseconds))

  return {
    isRunning() {
      return isRunning
    },
    clear() {
      isRunning = false
      clearInterval(timer)
    },
    time: intervalInMilliseconds,
    immediate,
  }
}
export type Timer = ReturnType<typeof highPrecisionInterval>
export function getFileNameByPath(path: string) {
  const [, name] = /[/\\]([^/\\]+)([/\\])?$/.exec(path) ?? []
  return name ?? ''
}
// Generate unique id
export function uuid() {
  let dt = new Date().getTime()
  const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  return id
}
export function debounce<T extends (...args: any) => any>(func: T, delay: number) {
  let timeout: NodeJS.Timeout

  return function (...args: Parameters<T>) {
    // Clear previous timer
    if (timeout) {
      clearTimeout(timeout)
    }

    // Set a new timer to delay execution of the passed function
    timeout = setTimeout(() => {
      func(...args)
    }, delay)
  } as T
}
export * from './Log'
