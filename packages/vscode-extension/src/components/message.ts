import { Log } from '@/utils'
// eslint-disable-next-line no-console
const consoleLog = console.log

const consoleWarn = console.warn

const consoleError = console.error

Object.defineProperties(console, {
  log: {
    value: (...messageArr: any[]) => {
      Log.output('log', ...messageArr)
      consoleLog(...messageArr)
    },
  },
  warn: {
    value: (...messageArr: any[]) => {
      Log.output('warn', ...messageArr)
      consoleWarn(...messageArr)
    },
  },
  error: {
    value: (...messageArr: any[]) => {
      Log.output('error', ...messageArr)
      consoleError(...messageArr)
    },
  },
})
