import type { ASTParser, ParserCtx, ParserSchemaType } from './type'
import type { AbstractAST, CommentType, MaybeSchemaObject } from '@/type'
import { CommentHelper } from '@/helper'
import { ASTType } from '@/type'
import { isReferenceObject } from '@/utils'

import { forward } from './forward'

export function getCommentBySchema(schema: MaybeSchemaObject, options: {
  type: CommentType
}) {
  const commenter = CommentHelper.load(options)
  if (!isReferenceObject(schema) && schema.title) {
    commenter.add('[title]', schema.title)
  }
  if (isReferenceObject(schema) && schema.summary) {
    commenter.add('[summary]', schema.summary)
  }
  if (schema.description) {
    commenter.add(schema.description)
  }
  return commenter.end()
}
export function initAST(schema: MaybeSchemaObject, ctx: ParserCtx) {
  const result: AbstractAST = {
    type: ASTType.UNKNOWN,
    comment: getCommentBySchema(schema, {
      type: ctx.options.commentType,
    }),
    keyName: ctx.keyName,
    deprecated: isReferenceObject(schema) ? false : schema.deprecated,
  }
  ctx.keyName = ''
  return result
}

export function parse(schema: MaybeSchemaObject, options: {
  type: ParserSchemaType
  ctx: ParserCtx
  parsers: ASTParser[]
}) {
  const { type, ctx, parsers } = options
  const parser = parsers.find(parser => [parser.type].flat().includes(type))
  if (parser) {
    return parser.parse(schema, ctx)
  }
  return null
}
export function getParserSchemaType(schema: MaybeSchemaObject): ParserSchemaType {
  if (isReferenceObject(schema)) {
    return 'reference'
  }
  const forwardType = forward(schema)
  if (forwardType) {
    return forwardType
  }
  if (schema.type && typeof schema.type === 'string') {
    return schema.type
  }
  return 'null'
}
