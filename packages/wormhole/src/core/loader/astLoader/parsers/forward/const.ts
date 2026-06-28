import type { Forwarder } from './type'

/**
 * 带有 const 关键字的 schema 优先路由到 const 解析器，
 * 即使 schema 同时声明了 type（如 `{ "type": "string", "const": "email" }`），
 * 也能正确产出字面量类型。
 */
export default <Forwarder>{
  is(schema): boolean {
    return schema && schema.const !== undefined && schema.const !== null
  },
  to: 'const',
}
