import type { ASTGenerator, GeneratorCtx, GeneratorOptions, GeneratorResult } from './type'
import type { AST } from '@/type'
import { CommentHelper } from '@/helper'

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

/** Generate normalized TS code body (prettier moved to file level per 9.5.1). Applies basic normalization for merged comments and indentation. */
export function normalizeCode(code: string, type: GeneratorResult['type']) {
  // Fix merged */ with next content: */id → */\nid, */{ → */\n{
  const result = code.replace(/\*\/(\s*\S)/g, '*/\n$1')
  const trimmed = result.trim()

  // Normalize indentation for block structures
  const blockTypes = ['interface', 'type', 'enum', 'group', 'array']
  if (!type || !blockTypes.includes(type))
    return trimmed

  // Match { ... } blocks (interface/enum) or Array<{ ... }> blocks
  const isBlock = trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('Array<{')
  if (!isBlock)
    return trimmed

  const lines = trimmed.split('\n')
  if (lines.length <= 2)
    return trimmed

  return lines.map((line, i) => {
    if (i === 0 || i === lines.length - 1)
      return line.trim()
    // Preserve nested indentation: lines already indented >= 2 spaces keep their depth
    const trimmed = line.trimStart()
    const leadingSpaces = line.length - trimmed.length
    return leadingSpaces >= 2 ? line : `  ${trimmed}`
  }).join('\n')
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
