import type { ApiPlugin } from '@/type'

/**
 * Creates a plugin factory function with proper typing
 *
 * @param plugin - Function that creates a plugin instance
 * @returns The original plugin function with proper typing
 *
 * @example
 * // Create a custom plugin
 * const myPlugin = createPlugin((options: MyOptions) => ({
 *   handleApi: (apiDescriptor) => {
 *     // Plugin implementation
 *     return apiDescriptor;
 *   }
 * }));
 *
 * // Use the plugin
 * generate({
 *   generator: [{
 *     // ...
 *     plugins: [myPlugin({ key: 'value' })]
 *   }]
 * });
 */
export function createPlugin<T extends any[]>(plugin: (...args: T) => ApiPlugin) {
  return plugin
}

export default createPlugin
