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
    // Only wrap in parentheses when needed for operator precedence:
    // In INTERSECTION (&), UNION/ENUM members need parens because `|` has lower precedence than `&`
    //   e.g. (string | number) & Pet  vs  string | number & Pet (= string | (number & Pet))
    // In UNION (|), INTERSECTION members do NOT need parens because `&` already binds tighter
    const memberTsStr = getValue(nextValue, ctx.options)
    const producesUnionLike = item.type === ASTType.UNION || item.type === ASTType.ENUM
    const needsParens = ast.type === ASTType.INTERSECTION && producesUnionLike
    groups.push(needsParens ? `(${memberTsStr})` : memberTsStr)
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
