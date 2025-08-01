import type { ASTParser, ParserCtx } from './type'
import type { AST, SchemaObject, TEnum } from '@/type'
import { standardLoader } from '@/core/loader/standardLoader'
import { logger } from '@/helper'
import { ASTType } from '@/type'
import { getType } from '@/utils'
import { initAST } from './utils'

export function enumTypeParser(schema: SchemaObject, ctx: ParserCtx): AST {
  const result: TEnum = {
    ...initAST(schema, ctx),
    type: ASTType.ENUM,
    params: [],
  }
  const enumArray = schema.enum ?? []
  const typeArray = [schema.type ?? []].flat() as string[]
  if (enumArray.some(item => !typeArray.includes(getType(item)))) {
    throw logger.throwError(`enum ${schema.title} type error`, {
      enum: enumArray,
      type: typeArray,
    })
  }
  enumArray.forEach((item) => {
    const keyName = typeof item === 'string' && standardLoader.validate(item) ? item.toUpperCase() : ''
    result.params.push({
      keyName,
      ast: {
        type: ASTType.LITERAL,
        params: item,
      },
    })
  })
  return result
}

export default <ASTParser>{
  type: 'enum',
  parse: enumTypeParser,
}
