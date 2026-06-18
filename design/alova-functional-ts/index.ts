import { createAlova } from 'alova';
import vueHook from 'alova/vue';
import adapterFetch from 'alova/fetch';
import { axiosRequestAdapter } from '@alova/adapter-axios';

// 创建alova实例
export const alovaInstance = createAlova({
  baseURL: 'https://jsonplaceholder.typicode.com/',
  statesHook: vueHook,
  requestAdapter: axiosRequestAdapter(),
  beforeRequest(method) {
    
  },
  responded: (response) => {
    return response.data;
  }
});
