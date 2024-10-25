import isEqualWith from 'lodash/isEqualWith';
import { expect } from 'vitest';
// 自定义比较器函数，忽略函数的比较
function customizer(objValue: any, othValue: any) {
  if (typeof objValue === 'function' && typeof othValue === 'function') {
    return objValue.toString() === othValue.toString(); // 比较函数内容
  }
}
export const isEqualObject = (objValue: any, othValue: any) => isEqualWith(objValue, othValue, customizer);
export const initExpect = () => {
  expect.extend({
    toBeDeepEqual(received, expected) {
      const pass = isEqualObject(received, expected);
      if (pass) {
        return {
          message: () => `expected ${received} not to be deep equal ${expected}`,
          pass: true
        };
      }
      return {
        message: () => `expected ${received} to be deep equal ${expected}`,
        pass: false
      };
    }
  });
};
export const createStrReg = (str: string) => {
  str = str.replace(/([[\](){}.*+|\\/^$?])/g, '\\$1').replace(/\s/g, '\\s+');
  return new RegExp(str);
};
