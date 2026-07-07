import type { ASTGenerator, GeneratorCtx, GeneratorResult } from './type'
import type { TTuple } from '@/type'
import { ASTType } from '@/type'
import { getValue, setComment } from './utils'

export function tupleTypeGenerator(ast: TTuple, ctx: GeneratorCtx) {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'type',
    code: '',
  }
  const params = [...ast.params]
  const minItems = Math.max(ast.minItems ?? 0, params.length)
  const maxItems = Math.max(ast.maxItems ?? minItems - 1, params.length)
  const spreadParam = ast.spreadParam ?? {
    type: ASTType.ANY,
  }

  while (params.length < minItems) {
    params.push(spreadParam)
  }
  const lines: string[] = [`[`]
  params.forEach((param, idx, arr) => {
    ctx.pathKey = param.keyName
    const value = getValue(ctx.next(param, ctx.options), ctx.options)
    const endText = idx === arr.length - 1 ? '' : ',';
    `${value}${endText}`.split('\n').forEach(line => lines.push(` ${line}`))
  })
  if (maxItems < minItems) {
    ctx.pathKey = spreadParam.keyName
    lines.push(`,\n...Array<${getValue(ctx.next(spreadParam, ctx.options), ctx.options)}>`)
  }
  lines.push(`]`)
  if (maxItems > minItems) {
    const nextParams = [...params]
    for (let i = 0; i < maxItems - minItems; i += 1) {
      nextParams.push(spreadParam)
      const nextResult = tupleTypeGenerator(
        {
          ...ast,
          keyName: '',
          params: nextParams,
          minItems: nextParams.length,
          maxItems: nextParams.length,
        },
        ctx,
      )
      lines.push(`\n| ${getValue(nextResult, ctx.options)}`)
    }
  }
  result.code = lines.join('\n')
  return result
}

export default <ASTGenerator>{
  type: ASTType.TUPLE,
  generate: tupleTypeGenerator,
}
