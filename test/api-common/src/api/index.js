const { createAlova } = require('alova');
const GlobalFetch = require('alova/GlobalFetch');
const vueHook = require('alova/vue');
const { createApis, withConfigType } = require('./createApis');
const alovaInstance = createAlova({
  baseURL: 'http://petstore.swagger.io/v2',
  statesHook: vueHook,
  requestAdapter: GlobalFetch(),
  beforeRequest: method => {},
  responded: res => {
    return res.json();
  }
});
const $$userConfigMap = withConfigType({});

/**
 * @type { Apis }
 */
const Apis = createApis(alovaInstance, $$userConfigMap);

module.exports = {
  Apis,
  alovaInstance,
  $$userConfigMap
};
