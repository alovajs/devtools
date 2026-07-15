import type { ApiPlugin, GeneratorConfig } from '@/type'
import { PluginName } from '@/constant'
import { normalizeBase, withCookie } from './shared'

export interface YapiOptions {
  /** YApi 服务基础地址，例如 `https://yapi.xxx.com` */
  url: string
  /** 项目 ID，必填，用于拼装导出地址 */
  pid: string | number
  /** OpenAPI 类型，默认 `OpenAPIV2` */
  type?: string
  /** 接口状态，默认 `all` */
  status?: string
  /** 是否包含 wiki，默认 `true` */
  isWiki?: boolean
  /** 登录 cookie。也可通过 fetchOptions.headers.cookie 传入 */
  cookie?: string
  /** 额外的 fetch 超时（毫秒） */
  timeout?: number
}

/**
 * YApi platform plugin.
 *
 * YApi projects are private, so the OpenAPI document must be exported through
 * YApi's own export endpoint, authenticated with your login cookie. The plugin
 * builds the export URL from the server base URL (`url`) plus the required
 * `pid` and the optional `type` / `status` / `isWiki` query params (which
 * default to `OpenAPIV2`, `all`, and `true` respectively).
 *
 * `url`, `pid` and `cookie` are required — the plugin throws a clear error when
 * any is missing.
 *
 * @param options - `{ url, pid, cookie?, type?, status?, isWiki?, timeout? }`
 *
 * @example
 * ```ts
 * import { yapi, alovaGlobals } from 'wormajs/plugin';
 *
 * defineConfig({
 *   generator: [{
 *     plugins: [
 *       yapi({
 *         url: 'https://yapi.xxx.com',
 *         pid: 123,
 *         cookie: '_yapi_token=xxx; _yapi_uid=yyy',
 *       }),
 *       alovaGlobals(),
 *     ],
 *     output: './src/api',
 *   }]
 * });
 * ```
 */
export function yapi(options: YapiOptions): ApiPlugin {
  return {
    name: PluginName.YAPI,
    async config({ config }: { config: GeneratorConfig }) {
      const baseUrl = options.url
      if (!baseUrl) {
        throw new Error(
          '[yapi] `url` is required — the YApi server base URL '
          + '(e.g. yapi({ url: "https://yapi.xxx.com", pid: 123, cookie: "..." })).',
        )
      }

      const pid = options.pid
      if (pid == null) {
        throw new Error(
          '[yapi] `pid` is required — the YApi project id used to build the export URL '
          + '(e.g. yapi({ url: "https://yapi.xxx.com", pid: 123, cookie: "..." })).',
        )
      }

      const cookie = options.cookie ?? config.fetchOptions?.headers?.cookie
      if (!cookie) {
        throw new Error(
          '[yapi] `cookie` is required. YApi projects are private, so the export '
          + 'endpoint needs your login cookie to fetch the OpenAPI document.\n'
          + '  e.g. yapi({ url: "https://yapi.xxx.com", pid: 123, cookie: "_yapi_token=xxx; ..." })',
        )
      }

      const type = options.type ?? 'OpenAPIV2'
      const status = options.status ?? 'all'
      const isWiki = options.isWiki ?? true
      const base = normalizeBase(baseUrl)
      config.input = `${base}/api/plugin/exportSwagger`
        + `?type=${encodeURIComponent(type)}`
        + `&pid=${encodeURIComponent(String(pid))}`
        + `&status=${encodeURIComponent(status)}`
        + `&isWiki=${isWiki}`

      withCookie(config, cookie)
      if (options.timeout != null) {
        config.fetchOptions = { ...config.fetchOptions, timeout: options.timeout }
      }
      return config
    },
  }
}
