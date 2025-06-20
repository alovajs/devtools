import { CommentHelper } from '@/helper';
import { AbstractAST, ASTType, CommentType, SchemaObject } from '@/type';
import { ParserCtx } from './type';

export const getCommentBySchema = (
  schema: SchemaObject,
  options: {
    type: CommentType;
  }
) => {
  const commenter = CommentHelper.load(options);
  if (schema.title) {
    commenter.add('[title]', schema.title);
  }
  if (schema.description) {
    commenter.add(schema.description);
  }
  return commenter.end();
};
export const initAST = (schema: SchemaObject, ctx: ParserCtx) => {
  const result: AbstractAST = {
    type: ASTType.UNKNOWN,
    comment: getCommentBySchema(schema, {
      type: ctx.options.commentType
    }),
    keyName: ctx.keyName,
    deprecated: schema.deprecated
  };
  ctx.keyName = '';
  return result;
};

export function getType(value: unknown) {
  // 处理 null 和 undefined
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  // 基本类型
  const type = typeof value;
  if (type !== 'object' && type !== 'function') {
    if (type === 'number' && Number.isNaN(value)) return 'NaN';
    if (type === 'number' && !Number.isFinite(value)) {
      return (value as number) > 0 ? 'Infinity' : '-Infinity';
    }
    return type;
  }

  // 特殊对象类型
  if (Array.isArray(value)) return 'Array';
  if (value instanceof Date) return 'Date';
  if (value instanceof RegExp) return 'RegExp';
  if (value instanceof Map) return 'Map';
  if (value instanceof Set) return 'Set';
  if (value instanceof Promise) return 'Promise';
  if (value instanceof Error) return 'Error';

  // 函数类型
  if (typeof value === 'function') {
    if (value.constructor.name === 'AsyncFunction') return 'AsyncFunction';
    if (value.constructor.name === 'GeneratorFunction') return 'GeneratorFunction';
    return 'Function';
  }

  // 其他对象类型
  const tag = Object.prototype.toString.call(value).slice(8, -1);
  if (tag !== 'Object') return tag;

  // 自定义类实例
  if (value.constructor && value.constructor !== Object) {
    return `Class (${value.constructor.name})`;
  }

  // 普通对象
  return 'Object';
}
