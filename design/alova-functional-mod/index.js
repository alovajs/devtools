import { createAlova } from 'alova';
import vueHook from 'alova/vue';
import adapterFetch from 'alova/fetch';

// 创建alova实例
export const alovaInstance = createAlova({
  baseURL: 'https://jsonplaceholder.typicode.com/',
  statesHook: vueHook,
  requestAdapter: adapterFetch(),
  beforeRequest(method) {
    
  },
  responded: (response) => {
    return response.json();
  }
});
