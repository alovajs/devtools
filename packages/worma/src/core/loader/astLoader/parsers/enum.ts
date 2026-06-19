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
  let typeArray = [schema.type ?? []].flat() as string[]

  // 如果没有指定type，从enum值中推断类型
  if (typeArray.length === 0 && enumArray.length > 0) {
    typeArray = [...new Set(enumArray.map(item => getType(item)))]
  }

  // 类型兼容性检查函数
  const isTypeCompatible = (itemType: string, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(itemType)
      || (allowedTypes.includes('number') && itemType === 'integer')
  }

  // 验证所有枚举值的类型
  const hasInvalidType = enumArray.some(item => !isTypeCompatible(getType(item), typeArray))
  if (hasInvalidType) {
    throw logger.throwError(`enum ${schema.title ?? 'undefined'} type error`, {
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
