import type { PluginName } from '@/constant'
import type { ApiPlugin, GeneratorConfig } from '@/type'

/** Remove trailing slashes from a base URL */
export function normalizeBase(baseUrl: string): string {
  while (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1)
  }
  return baseUrl
}

/**
 * Factory for "URL-constructing" platform plugins.
 *
 * Unlike the old `platform()` helper, the platform base URL(s) are supplied as
 * the plugin's own argument (e.g. `swagger('https://petstore.swagger.io')`)
 * rather than being read from `config.input`. The plugin writes the resolved
 * candidate URLs into `config.input` inside its `config` hook, so downstream
 * fetching (which tries each URL in order and keeps the first success) works
 * unchanged.
 */
export function defineUrlPlatformPlugin(
  name: PluginName,
  buildUrls: (base: string) => string[],
) {
  return (input: string | string[]): ApiPlugin => {
    const inputs = Array.isArray(input) ? [...new Set(input)] : [input]
    return {
      name,
      config({ config }: { config: GeneratorConfig }) {
        config.input = inputs.flatMap(url => buildUrls(normalizeBase(String(url))))
        return config
      },
    }
  }
}

/** Merge a cookie into config.fetchOptions.headers */
export function withCookie(config: GeneratorConfig, cookie: string): GeneratorConfig {
  config.fetchOptions = {
    ...config.fetchOptions,
    headers: {
      ...config.fetchOptions?.headers,
      cookie,
    },
  }
  return config
}
