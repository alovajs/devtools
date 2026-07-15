import { PluginName } from '@/constant'
import { defineUrlPlatformPlugin } from './shared'

/**
 * Swagger platform plugin.
 *
 * Pass the base URL of your Swagger UI / server; the plugin will try several
 * common OpenAPI document endpoints (OAS3 first, then Swagger2, then the bare
 * base URL) and let the framework pick the first one that responds.
 *
 * @param input - base URL string, or an array of base URLs
 *
 * @example
 * ```ts
 * import { swagger, alovaGlobals } from 'wormajs/plugin';
 *
 * defineConfig({
 *   generator: [{
 *     plugins: [swagger('https://petstore3.swagger.io'), alovaGlobals()],
 *     output: './src/api',
 *   }]
 * });
 * ```
 */
export const swagger = defineUrlPlatformPlugin(PluginName.SWAGGER, base => [
  `${base}/openapi.json`,
  `${base}/v2/swagger.json`,
  `${base}/api/v3/openapi.json`,
  base,
])
