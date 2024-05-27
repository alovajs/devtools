import { createAlova } from 'alova';
import GlobalFetch from 'alova/GlobalFetch';
import vueHook from 'alova/vue';
import apiRecords from './apiDefinitions';
import { createApis } from './createApis';

export const alovaInstance = createAlova({
  baseURL: 'openapi文件中的server地址',
  statesHook: vueHook,
  requestAdapter: GlobalFetch(),
  beforeRequest: method => {},
  responded: res => {
    return res.json();
  }
});

const configMap: MethodsConfigMap = {
  'pet.userLogin': {
    // transformData: (res: string[]) => {
    //   return res.map(str => str.trim());
    // }
  }
};

type MethodsConfigMap = {
  [apiPath in keyof typeof apiRecords]?: Parameters<(typeof alovaInstance)['Get']>['1'];
};

const Apis = createApis(alovaInstance, configMap);

// 如果是全局定义
(window as any).Apis = Apis;

// 如果不是则直接导出
// export Apis;
