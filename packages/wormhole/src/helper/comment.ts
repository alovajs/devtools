import type { CommentType } from '@/type'

interface CommentOptions {
  type: CommentType
  comment?: string
}
type TransformKey = '[deprecated]' | '[title]' | '[required]' | '[cycle]' | '[summary]'
export class CommentHelper {
  private type: CommentType = 'line'
  private comment: string = ''
  private transformMap: Record<TransformKey, string | ((text: string) => string)> = {
    '[deprecated]': '@deprecated',
    '[required]': '[required]',
    '[title]': (text: string) => {
      const [, nextText = ''] = /\[title\](.*)/.exec(text) ?? []
      return `${nextText.trim()}\n---`
    },
    '[cycle]': (text: string) => {
      const [, nextText = ''] = /\[cycle\](.*)/.exec(text) ?? []
      return `${nextText.trim()}\n---`
    },
    '[summary]': (text: string) => {
      const [, nextText = ''] = /\[summary\](.*)/.exec(text) ?? []
      return `${nextText.trim()}\n---`
    },
  }

  static load(options: CommentOptions) {
    return new CommentHelper().load(options)
  }

  static parse(comment: string) {
    return comment
      .split('\n')
      .map(span => span.replace(/^\/\*+|\*+\/|\*|\/\//, '').trim())
      .filter(span => span)
  }

  static parseStr(comment: string) {
    return this.parse(comment).join('\n')
  }

  load(options: CommentOptions) {
    this.type = options.type
    if (options.comment) {
      this.comment = options.comment
    }
    return this
  }

  add(text: TransformKey | ({} & string)): this
  add(key: TransformKey, text?: string): this
  add(key: string | TransformKey, text: string = '') {
    if (this.comment) {
      this.comment += '\n'
    }
    this.comment += this.transformText(`${key} ${text}`)
      .split('\n')
      .map(span => `${this.preText()} ${span}`)
      .join('\n')
    return this
  }

  end() {
    const result = this.comment ? this.startText() + this.normalize() + this.endText() : ''
    this.comment = ''
    return result
  }

  private startText() {
    return this.type === 'doc' ? '/**\n' : ''
  }

  private preText() {
    return this.type === 'doc' ? '*' : '//'
  }

  private endText() {
    return this.type === 'doc' ? '\n */\n' : '\n'
  }

  private normalize() {
    const comment = CommentHelper.parse(this.comment)
      .map(span => `${this.preText()} ${span}`)
      .join('\n')
    return comment.replace('*/*', '* / *').replace('/*', '/ *').replace('*/', '* /')
  }

  private transformText(text: string) {
    text = text.trim()
    if (this.type === 'line') {
      return text
    }
    const key = Object.keys(this.transformMap).find(key => text.startsWith(key)) as TransformKey
    if (key) {
      const transformer = this.transformMap[key]
      return typeof transformer === 'function' ? transformer(text) : (transformer ?? text)
    }
    return text
  }
}
export const commentHelper = new CommentHelper()
