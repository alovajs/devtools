import { PluginName } from '@/constant'
import { defineUrlPlatformPlugin } from './shared'

/**
 * Knife4j platform plugin.
 *
 * Pass the base URL of your Knife4j instance; the plugin will try the OAS3
 * endpoint (springdoc) first, then the Swagger2 endpoint (springfox), then the
 * bare base URL.
 *
 * @param input - base URL string, or an array of base URLs
 *
 * @example
 * ```ts
 * plugins: [knife4j('https://openapi3.demo.knife4jnext.com'), alovaGlobals()]
 * ```
 */
export const knife4j = defineUrlPlatformPlugin(PluginName.KNIFE4J, base => [
  `${base}/v3/api-docs`,
  `${base}/v2/api-docs`,
  base,
])
