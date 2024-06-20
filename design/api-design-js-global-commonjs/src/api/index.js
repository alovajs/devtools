const { createAlova } = require('alova');
const GlobalFetch = require('alova/GlobalFetch');
const vueHook = require('alova/vue');
const { createApis, withConfigType } = require('./createApis');
const alovaInstance = createAlova({
  baseURL: '/api',
  statesHook: vueHook,
  requestAdapter: GlobalFetch(),
  beforeRequest: method => {},
  responded: res => {
    return res.json();
  }
});
const $$userConfigMap = withConfigType({});
/**
 * @type{APIS}
 */
const Apis = createApis(alovaInstance, $$userConfigMap);

// 如果是全局定义
globalThis.Apis = Apis;

// 如果不是则直接导出
module.exports = {
  Apis,
  alovaInstance,
  $$userConfigMap
};
