const { createAlova } = require('alova');
const GlobalFetch = require('alova/GlobalFetch');
const vueHook = require('alova/vue');
const { createApis, withConfigType } = require('./createApis');

const alovaInstance = createAlova({
  baseURL: 'openapi文件中的server地址',
  statesHook: vueHook,
  requestAdapter: GlobalFetch(),
  beforeRequest: method => {},
  responded: res => {
    return res.json();
  }
});

const $$userConfigMap = withConfigType({
  'user.userLogin': {
    cache: 'force-cache'
    // transformData: data => {
    //   return 'abc';
    // }
  }
});
/**
 * @type{APIS}
 */
const Apis = createApis(alovaInstance, $$userConfigMap);

// 如果是全局定义
globalThis.Apis = Apis;

// 如果不是则直接导出
// export Apis;
module.exports = {
  Apis,
  alovaInstance,
  $$userConfigMap
};
