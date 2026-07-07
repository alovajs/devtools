import { alovaInstance } from "..";
import { buildPayload } from "../helper";
import { Alova2MethodConfig } from "../typed";
import { tag1DefaultConfig } from ".";
import type * as ComponentTypes from '../components';

export type ExtractResponded<
  UserDefinedConfig extends Alova2MethodConfig<any>,
  UnifiedConfigKey extends string,
  Default
> = UserDefinedConfig extends { transform: (...args: any[]) => any }
  ? Awaited<ReturnType<UserDefinedConfig['transform']>>
  : UnifiedConfigKey extends keyof typeof tag1DefaultConfig
    ? typeof tag1DefaultConfig[UnifiedConfigKey] extends { transform: (...args: any[]) => any }
      ? Awaited<ReturnType<typeof tag1DefaultConfig[UnifiedConfigKey]['transform']>>
      : Default
  : Default;

/**
 * ---
 *
 * [GET] 资源文件预览方式2（接口需要增加token参数）
 *
 * **path:** /v1.0/pt/common/upload/{storageType}/view
 *
 * ---
 *
 * **Path Parameters**
 * ```ts
 * type PathParameters = {
 *   // 存储类型，oss，minio，必填
 *   storageType: string
 * }
 * ```
 *
 * ---
 *
 * **Query Parameters**
 * ```ts
 * type QueryParameters = {
 *   // 文件名，必填
 *   objectName?: string
 *   // 应用code,非必填
 *   appCode?: string
 *   // 指定文件内容类型,非必填
 *   contentType?: string
 *   // 下载,非必填，1表示下载
 *   download?: string
 * }
 * ```
 *
 * ---
 *
 * **Response**
 * ```ts
 * type Response = null
 * ```
 */
export function fn1<Config extends Alova2MethodConfig<ComponentTypes.Fn1Response> & {
  pathParams: {
    id: string
  }
}>(config: Config) {
  const { url, data, mergedConfig } = buildPayload('/users/{id}', tag1DefaultConfig, fn1.name, config);
  return alovaInstance.Request<ExtractResponded<Config, 'fn1', ComponentTypes.Fn1Response>>({
    ...mergedConfig,
    url,
    data,
    method: 'GET'
  });
}
