import type { Forwarder } from './type'

export default <Forwarder>{
  is(schema): boolean {
    // 判断是否为元组类型
    // 1. type 为 'array'
    // 2. 且 items 是数组（表示固定位置的元素类型）
    return schema.type === 'array' && Array.isArray(schema.items) && schema.items.length > 0
  },
  to: 'tuple',
}
