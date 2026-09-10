import type { ApiPlugin, GeneratorConfig } from '@/type'
import { PluginName } from '@/constant'

export interface PostmanOptions {
  /** Postman API Key, generated from Postman → Settings → API keys */
  apiKey: string
  /** The uid of the Postman collection */
  collectionId: string
}

/** Base address of the Postman API */
const POSTMAN_API_BASE = 'https://api.getpostman.com'

/**
 * Unwraps the OpenAPI definition returned by the Postman collection
 * transformation endpoint, which responds with `{ output: "<stringified spec>" }`
 * instead of the specification itself.
 *
 * The response is parsed exactly once. Anything that is not a transformation
 * envelope (an error payload, an HTML page, a malformed body, …) throws instead
 * of being silently passed through, so the real problem surfaces immediately.
 * The unwrapped spec is then validated by the generator's parser, like any other
 * input — this function does not re-parse or validate it.
 */
export function unwrapTransformationOutput(spec: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(spec)
  }
  catch (error) {
    throw new Error(
      '[postman] The transformation response is not valid JSON: '
      + `${error instanceof Error ? error.message : String(error)}. `
      + `Received: ${spec.slice(0, 200)}`,
    )
  }

  const output = (parsed as { output?: unknown } | null)?.output
  if (typeof output !== 'string') {
    throw new TypeError(
      '[postman] The transformation response must be a JSON object with a string `output` field. '
      + 'Check that the collection uid is correct and that you have access to it. '
      + `Received: ${spec.slice(0, 200)}`,
    )
  }

  return output
}

/**
 * Postman platform plugin.
 *
 * Postman collections are not OpenAPI documents, so the plugin points `input` to
 * the collection transformation endpoint, which converts the collection into an
 * OpenAPI definition:
 *
 * ```
 * https://api.getpostman.com/collections/<collectionId>/transformations
 * ```
 *
 * The `x-api-key` header is injected through `fetchOptions`. The endpoint responds
 * with `{ output: "<spec>" }`, so the plugin unwraps that envelope in its
 * `beforeSpecParse` hook.
 *
 * `apiKey` and `collectionId` are both required — the plugin throws a clear error
 * when either is missing.
 *
 * @param options - `{ apiKey, collectionId }`
 * @param options.apiKey - Postman API key used to read the collection
 * @param options.collectionId - The uid of the Postman collection
 *
 * @example
 * ```ts
 * import { postman, alovaGlobals } from 'wormajs/plugin';
 *
 * defineConfig({
 *   generator: [{
 *     plugins: [
 *       postman({
 *         apiKey: 'PMAK-xxx',
 *         collectionId: '12345678-a1b2-c3d4-e5f6-7890abcdef12',
 *       }),
 *       alovaGlobals(),
 *     ],
 *     output: './src/api',
 *   }]
 * });
 * ```
 */
export function postman({ apiKey, collectionId }: PostmanOptions): ApiPlugin {
  return {
    name: PluginName.POSTMAN,
    async config({ config }: { config: GeneratorConfig }) {
      if (!apiKey) {
        throw new Error(
          '[postman] `apiKey` is required — the Postman API key used to read the collection '
          + '(e.g. postman({ apiKey: "PMAK-xxx", collectionId: "12345678-..." })).',
        )
      }

      if (!collectionId) {
        throw new Error(
          '[postman] `collectionId` is required — the uid of the Postman collection '
          + '(e.g. postman({ apiKey: "PMAK-xxx", collectionId: "12345678-..." })).',
        )
      }

      config.input = `${POSTMAN_API_BASE}/collections/${encodeURIComponent(collectionId.trim())}/transformations`
      config.fetchOptions = {
        ...config.fetchOptions,
        method: 'GET',
        headers: {
          ...config.fetchOptions?.headers,
          'x-api-key': apiKey,
        },
      }
      return config
    },
    beforeSpecParse({ spec }) {
      return unwrapTransformationOutput(spec)
    },
  }
}

export default postman
