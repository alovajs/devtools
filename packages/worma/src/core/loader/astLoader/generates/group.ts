import type { ASTGenerator, GeneratorCtx, GeneratorResult } from './type'
import type { TIntersection, TUnion } from '@/type'
import { ASTType } from '@/type'
import { getValue, setComment } from './utils'

export function groupTypeGenerator(ast: TIntersection | TUnion, ctx: GeneratorCtx) {
  const result: GeneratorResult = {
    name: ast.keyName ?? '',
    comment: setComment(ast, ctx.options),
    type: 'type',
    code: '',
  }
  const groups: string[] = []
  ast.params.forEach((item) => {
    ctx.pathKey = `${item.keyName}`
    const nextValue = ctx.next(item, ctx.options)
    groups.push(`(${getValue(nextValue, ctx.options)})`)
  })

  switch (ast.type) {
    case ASTType.INTERSECTION:
      result.code = groups.join(' & ')
      break
    case ASTType.UNION:
      result.code = groups.join(' | ')
      break
    default:
      break
  }
  return result
}

export default <ASTGenerator>{
  type: [ASTType.INTERSECTION, ASTType.UNION],
  generate: groupTypeGenerator,
}
