import { getFileNameByPath } from '@/utils'

export default class AlovaError extends Error {
  ERROR_CODE = 'error'
  private path?: string
  constructor(message?: string, path?: string) {
    super(message)
    this.name = 'AlovaError'
    this.path = path
  }

  getMessage() {
    if (!this.path) {
      return this.message
    }
    return `[${getFileNameByPath(this.path)}]: ${this.message}`
  }

  setPath(path: string) {
    this.path = path
    this.message = this.getMessage()
  }

  getPath() {
    return this.path
  }
}
export const AlovaErrorConstructor = AlovaError as unknown as ErrorConstructor
