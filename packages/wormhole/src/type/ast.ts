export enum ASTType {
  ANY = 'ANY',
  ARRAY = 'ARRAY',
  BOOLEAN = 'BOOLEAN',
  ENUM = 'ENUM',
  INTERFACE = 'INTERFACE',
  INTERSECTION = 'INTERSECTION',
  LITERAL = 'LITERAL',
  NEVER = 'NEVER',
  NUMBER = 'NUMBER',
  NULL = 'NULL',
  OBJECT = 'OBJECT',
  REFERENCE = 'REFERENCE',
  STRING = 'STRING',
  TUPLE = 'TUPLE',
  UNION = 'UNION',
  CUSTOM = 'CUSTOM',
  UNKNOWN = 'UNKNOWN'
}
export type AST =
  | TAny
  | TArray
  | TBoolean
  | TEnum
  | TInterface
  | TIntersection
  | TLiteral
  | TNever
  | TNumber
  | TNull
  | TObject
  | TReference
  | TString
  | TCustom
  | TTuple
  | TUnion
  | TUnknown;

export type CommentType = 'line' | 'doc';
export interface AbstractAST {
  // 节点类型
  type: ASTType;
  // 注释
  comment?: string;
  // 深度注释
  deepComment?: string;
  // 外部引用
  keyName?: string;
  // 类型名
  name?: string;
  // 是否弃用
  deprecated?: boolean;
}

export type ASTWithComment = AST & { comment: string; commentType: CommentType };
export type ASTWithName = AST & { keyName: string };

/// /////////////////////////////////////////     types

export interface TTuple extends AbstractAST {
  type: ASTType.TUPLE;
  params: AST[];
  spreadParam?: AST;
  minItems?: number;
  maxItems?: number;
}
export interface TArray extends AbstractAST {
  type: ASTType.ARRAY;
  params: AST;
}
export interface TEnum extends AbstractAST {
  type: ASTType.ENUM;
  params: TEnumParam[];
}

export interface TEnumParam {
  ast: AST;
  keyName: string;
}

export interface TInterface extends AbstractAST {
  type: ASTType.INTERFACE;
  params: TInterfaceParam[];
  addParams?: AST;
}

export interface TInterfaceParam {
  ast: AST;
  keyName: string;
  isRequired: boolean;
}
// simple type start
export interface TReference extends AbstractAST {
  type: ASTType.REFERENCE;
  params: string;
}
export interface TLiteral<T = boolean | string | number | null | any[] | Record<string, any>> extends AbstractAST {
  params: T;
  type: ASTType.LITERAL;
}
export interface TAny extends AbstractAST {
  type: ASTType.ANY;
}

export interface TBoolean extends AbstractAST {
  type: ASTType.BOOLEAN;
}

export interface TNever extends AbstractAST {
  type: ASTType.NEVER;
}

export interface TUnknown extends AbstractAST {
  type: ASTType.UNKNOWN;
}

export interface TNumber extends AbstractAST {
  type: ASTType.NUMBER;
}

export interface TNull extends AbstractAST {
  type: ASTType.NULL;
}

export interface TObject extends AbstractAST {
  type: ASTType.OBJECT;
}

export interface TString extends AbstractAST {
  type: ASTType.STRING;
}
export interface TCustom extends AbstractAST {
  type: ASTType.CUSTOM;
  params: string;
}
// simple type end

// group type start
export interface TIntersection extends AbstractAST {
  type: ASTType.INTERSECTION;
  params: AST[];
}
export interface TUnion extends AbstractAST {
  type: ASTType.UNION;
  params: AST[];
}
// group type end
