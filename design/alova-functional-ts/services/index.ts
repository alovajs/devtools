import { setMethodDefaultConfig } from '../helper';
import * as tag1 from './tag1';
import * as tag2 from './tag2';

export const tag1DefaultConfig = setMethodDefaultConfig(tag1, {
  fn1: {
    headers: {
      authorization: 'Bearer xxx'
    },
    transform(data) {
      return {
        data,
        token: 'xxx'
      }
    },
  }
});

export const tag2DefaultConfig = setMethodDefaultConfig(tag2, {
  fn2: {
    headers: {
      authorization: 'Bearer yyy'
    },
    responseType: 'document',
    transform(data) {
      return data.id
    },
  }
});