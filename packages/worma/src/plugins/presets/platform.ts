import type { ApiPlugin } from '@/type'
import { PluginName } from '@/constant'

/**
 * Supported platform types
 */
export type PlatformType = 'swagger' | 'knife4j' | 'fastapi' | 'yapi'

/**
 * Generate OpenAPI file URLs based on platform type.
 * For Swagger and Knife4j, generates multiple URLs covering both OAS3 and Swagger2 endpoints.
 */
function resolvePlatformUrls(baseUrl: string, platformType: PlatformType): string[] {
  // Normalize: remove trailing slash
  const base = baseUrl.replace(/\/+$/, '')

  switch (platformType) {
    case 'swagger':
      // Try OAS3 first, then Swagger2, then generic openapi.json
      return [
        `${base}/openapi.json`,
        `${base}/v2/swagger.json`,
        `${base}/api/v3/openapi.json`,
        baseUrl
      ]
    case 'knife4j':
      // Try OAS3 first (springdoc), then Swagger2 (springfox)
      return [
        `${base}/v3/api-docs`,
        `${base}/v2/api-docs`,
        baseUrl,
      ]
    case 'fastapi':
      return [`${base}/openapi.json`, baseUrl]
    case 'yapi':
      // YApi requires pid and token in URL, use input as-is
      return [baseUrl]
  }
}

/**
 * Platform plugin for auto-resolving OpenAPI file URLs.
 *
 * Pass a platform type (e.g., `'swagger'`) and the plugin will use `config.input`
 * as the base URL to generate candidate OpenAPI file URLs. The framework will try
 * each URL in order and use the first successful response.
 *
 * @param platformType - The platform type: 'swagger' | 'knife4j' | 'fastapi' | 'yapi'
 * @returns ApiPlugin
 *
 * @example
 * ```ts
 * import { platform, alovaGlobals } from 'worma/plugin';
 *
 * defineConfig({
 *   generator: [{
 *     input: 'https://petstore3.swagger.io',
 *     plugins: [platform('swagger'), alovaGlobals()],
 *     output: './src/api',
 *   }]
 * });
 * ```
 */
export function platform(platformType: PlatformType): ApiPlugin {
  return {
    name: PluginName.PLATFORM,
    config({ config }) {
      const raw = config.input
      if (!raw) return config

      // Normalize to an array of base URLs, deduplicate
      const inputs = Array.isArray(raw) ? [...new Set(raw)] : [raw]
      // For each input, generate platform URLs, then flatten
      config.input = inputs.flatMap(url => resolvePlatformUrls(url, platformType))
      return config
    },
  }
}

export default platform
