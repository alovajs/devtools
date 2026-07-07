const { createAlova } = require('alova');
const adapterFetch = require('alova/fetch');

// 创建alova实例
const alovaInstance = createAlova({
  baseURL: 'https://jsonplaceholder.typicode.com/',
  requestAdapter: adapterFetch(),
  beforeRequest(method) {
    
  },
  responded: (response) => {
    return response.json();
  }
});

module.exports = {
  alovaInstance
};
