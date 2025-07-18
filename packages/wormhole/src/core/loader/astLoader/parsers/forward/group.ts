import type { Forwarder } from './type'

export default <Forwarder>{
  is(schema): boolean {
    // 判断是否为组合类型
    // 1. 有 oneOf 字段（联合类型）
    // 2. 或者有 anyOf 字段（联合类型）
    // 3. 或者有 allOf 字段（交叉类型）
    return !!schema.oneOf || !!schema.anyOf || !!schema.allOf
  },
  to: 'group',
}
