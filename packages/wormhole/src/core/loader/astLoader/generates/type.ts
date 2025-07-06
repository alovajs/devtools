import { AST, ASTType, CommentType } from '@/type';

export interface GeneratorCtx {
  options: GeneratorOptions;
  pathKey?: string;
  path: string[];
  next(ast: AST, options: GeneratorOptions): GeneratorResult;
}
export interface ASTGenerator {
  type: ASTType | ASTType[];
  generate(ast: AST, ctx: GeneratorCtx): GeneratorResult;
}
export interface GeneratorResult {
  name: string;
  type: 'type' | 'interface' | 'enum';
  comment?: string;
  code: string;
}

export interface GeneratorOptions {
  deep?: boolean;
  shallowDeep?: boolean;
  noEnum?: boolean;
  commentType: CommentType;
}
