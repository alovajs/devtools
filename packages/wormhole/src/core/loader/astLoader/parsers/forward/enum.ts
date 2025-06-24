import { Forwarder } from './type';

export default <Forwarder>{
  is(schema): boolean {
    // 判断是否为枚举类型
    // 有 enum 字段且不为空数组
    return !!schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0;
  },
  to: 'enum'
};
