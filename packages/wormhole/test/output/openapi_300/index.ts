/* eslint-disable */
import { createAlova } from 'alova';
import GlobalFetch from 'alova/GlobalFetch';
import { createApis, withConfigType } from './createApis';

export const alovaInstance = createAlova({
  baseURL: '/api1',
  requestAdapter: GlobalFetch(),
  beforeRequest: method => {},
  responded: res => {
    return res.json();
  }
});

export const $$userConfigMap = withConfigType({});

const Apis = createApis(alovaInstance, $$userConfigMap);

export default Apis;
