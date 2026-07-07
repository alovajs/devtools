import { setMethodDefaultConfig } from '../helper';
import * as tag1 from './tag1';

export const tag1DefaultConfig = setMethodDefaultConfig(tag1, {
  fn1: {
    headers: {
      authorization: 'Bearer xxx'
    },
    pathParams: {
      id: 'fff'
    },
    transform(data) {
      return {
        data,
        token: 'xxx'
      }
    },
  }
});