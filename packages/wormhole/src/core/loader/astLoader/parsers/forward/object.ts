import { Forwarder } from './type';

export default <Forwarder>{
  is(schema): boolean {
    // 判断是否为对象类型
    // 1. type 为 'object'
    // 2. 或者有 properties 字段
    // 3. 或者有 additionalProperties 字段
    return schema.type === 'object' || !!schema.properties || !!schema.additionalProperties;
  },
  to: 'object'
};
