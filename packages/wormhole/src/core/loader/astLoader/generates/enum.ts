import type { ASTGenerator, GeneratorCtx, GeneratorResult } from './type'
import type { TEnum } from '@/type'
import { standardLoader } from '@/core/loader'
import { ASTType } from '@/type'
import { getType } from '@/utils'
import { getValue, setComment } from './utils'

export function normalEnumTypeGenerator(ast: TEnum, ctx: GeneratorCtx) {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'enum',
    code: '',
  }
  const lines: string[] = [`{`]
  ast.params.forEach((param, idx, arr) => {
    ctx.pathKey = param.keyName
    const paramResult = ctx.next(param.ast, ctx.options)
    const endText = idx === arr.length - 1 ? '' : ','
    const keyName = standardLoader.validate(param.keyName) ? param.keyName : `"${param.keyName || paramResult.code}"`;
    `${param.ast.comment ?? ''}${keyName} = ${paramResult.code}${endText}`
      .split('\n')
      .forEach(line => lines.push(` ${line}`))
  })
  lines.push(`}`)
  result.code = lines.join('\n')
  return result
}
function otherEnumTypeGenerator(ast: TEnum, ctx: GeneratorCtx) {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'type',
    code: '',
  }
  result.code = ast.params
    .map((param) => {
      ctx.pathKey = param.keyName
      return getValue(ctx.next(param.ast, ctx.options), ctx.options)
    })
    .join(' | ')
  return result
}
export function isNormalEnum(ast: TEnum, ctx: GeneratorCtx) {
  return !ctx.options.noEnum
    && ast.params.every(
      item =>
        item.ast.type === ASTType.LITERAL
        && ['string', 'number', 'integer'].includes(getType(item.ast.params))
        && item.keyName,
    )
}
export function enumTypeGenerator(ast: TEnum, ctx: GeneratorCtx) {
  if (ctx.path.length <= 1 && isNormalEnum(ast, ctx)) {
    return normalEnumTypeGenerator(ast, ctx)
  }
  return otherEnumTypeGenerator(ast, ctx)
}

export default <ASTGenerator>{
  type: ASTType.ENUM,
  generate: enumTypeGenerator,
}
