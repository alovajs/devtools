import type { AST, CommentType, OpenAPIDocument, ReferenceObject, SchemaObject, SchemaType } from '@/type'

export type ParserSchemaType = SchemaType | 'enum' | 'group' | 'tuple' | 'reference'
export interface ASTParser {
  type: ParserSchemaType | ParserSchemaType[]
  parse: (schema: SchemaObject, ctx: ParserCtx) => AST
}
export interface ParserOptions {
  commentType: CommentType
  document: OpenAPIDocument
  defaultRequire?: boolean
  onReference?: (ast: AST) => void
}
export interface ParserCtx {
  next: (schema: SchemaObject | ReferenceObject, options: ParserOptions) => AST
  keyName?: string
  pathKey?: string
  visited: Set<string>
  pathMap: Map<string, string>
  path: string[]
  options: ParserOptions
}
