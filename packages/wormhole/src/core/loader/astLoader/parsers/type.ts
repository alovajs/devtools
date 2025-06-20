import type { AST, CommentType, ReferenceObject, SchemaObject, SchemaType } from '@/type';

export type ParserSchemaType = SchemaType | 'enum' | 'group' | 'tuple' | 'reference';
export interface ASTParser {
  type: ParserSchemaType | ParserSchemaType[];
  parse(schema: SchemaObject, ctx: ParserCtx): AST;
}
export interface ParserOptions {
  commentType: CommentType;
}
export interface ParserCtx {
  next(schema: SchemaObject | ReferenceObject, options: ParserOptions): AST;
  keyName?: string;
  options: ParserOptions;
}
