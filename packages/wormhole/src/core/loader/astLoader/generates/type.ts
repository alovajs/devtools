import { AST, ASTType, CommentType } from '@/type';

export interface GeneratorCtx {
  options: GeneratorOptions;
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
  commentType: CommentType;
}
