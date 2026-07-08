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
    let needsParens = ast.type === ASTType.INTERSECTION && producesUnionLike
    // In UNION (|), wrap block-like members that contain const discriminators
    // (key:"value" literal properties) so discriminated union branches are clearly
    // delimited (see issue #824).
    if (!needsParens && ast.type === ASTType.UNION && /\w+:"[^"]*"/.test(memberTsStr))
      needsParens = true

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
