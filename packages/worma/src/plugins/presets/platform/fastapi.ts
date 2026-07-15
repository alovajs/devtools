import { PluginName } from '@/constant'
import { defineUrlPlatformPlugin } from './shared'

/**
 * FastAPI platform plugin.
 *
 * Pass the base URL of your FastAPI app; the plugin will try `/openapi.json`
 * first, then fall back to the bare base URL.
 *
 * @param input - base URL string, or an array of base URLs
 *
 * @example
 * ```ts
 * plugins: [fastapi('http://fastapi-example.dokkuapp.com'), alovaGlobals()]
 * ```
 */
export const fastapi = defineUrlPlatformPlugin(PluginName.FASTAPI, base => [
  `${base}/openapi.json`,
  base,
])
