import type { ASTGenerator, GeneratorCtx, GeneratorOptions, GeneratorResult } from './type'
import type { AST } from '@/type'
import { CommentHelper } from '@/helper'
import { format } from '@/utils'

export function generate(ast: AST, ctx: GeneratorCtx, generators: ASTGenerator[]) {
  const generator = generators.find((generator) => {
    const tyes = [generator.type].flat()
    return tyes.includes(ast.type)
  })
  if (generator) {
    return generator.generate(ast, ctx)
  }
  return null
}

export function getValue(result: GeneratorResult, options: GeneratorOptions) {
  if (options.shallowDeep) {
    options.shallowDeep = false
    options.deep = false
    return result.code
  }
  return options.deep || !result.name ? result.code : result.name
}

export function setComment(ast: AST, options: GeneratorOptions) {
  let { comment } = ast
  if (ast.deepComment && options.deep) {
    comment += ast.deepComment
  }
  const commenter = CommentHelper.load({
    type: options.commentType,
    comment,
  })

  if (ast.deprecated) {
    commenter.add('[deprecated]')
  }
  ast.comment = commenter.end()
  return ast.comment ?? ''
}

export async function normalizeCode(code: string, type: GeneratorResult['type']) {
  const typeMap: Record<
    GeneratorResult['type'],
    {
      reg: RegExp
      transform: (code: string) => string
    }
  > = {
    type: {
      reg: /type Ts =(.*)/s,
      transform(code: string): string {
        return getTsStr({ type: 'type', name: 'Ts', code })
      },
    },
    interface: {
      reg: /interface Ts (.*)/s,
      transform(code: string): string {
        return getTsStr({ type: 'interface', name: 'Ts', code })
      },
    },
    enum: {
      reg: /enum Ts (.*)/s,
      transform(code: string): string {
        return getTsStr({ type: 'enum', name: 'Ts', code })
      },
    },
  }
  const tsStrFormat = await format(typeMap[type].transform(code), {
    semi: false, // remove semicolon
  })
  const resultFormat = typeMap[type].reg.exec(tsStrFormat)?.[1] ?? ''
  return resultFormat.trim()
}

export function getTsStr(genResult: GeneratorResult, options?: {
  export?: boolean
}) {
  let result = genResult.code
  switch (genResult.type) {
    case 'interface':
      result = `interface ${genResult.name}  ${genResult.code}`
      break
    case 'type':
      result = `type ${genResult.name} = ${genResult.code}`
      break
    case 'enum':
      result = `enum ${genResult.name} ${genResult.code}`
      break
    default:
      break
  }
  if (options?.export) {
    result = `export ${result}`
  }
  return result
}
