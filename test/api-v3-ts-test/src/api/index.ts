import { createAlova } from 'alova';
import fetchAdapter from 'alova/fetch';
import { createApis, withConfigType } from './createApis';

export const alovaInstance = createAlova({
  baseURL: 'https://petstore.swagger.io/v2',
  requestAdapter: fetchAdapter(),
  beforeRequest: method => {},
  responded: res => {
    return res.json();
  }
});

export const $$userConfigMap = withConfigType({});

const Apis = createApis(alovaInstance, $$userConfigMap);

export default Apis;
