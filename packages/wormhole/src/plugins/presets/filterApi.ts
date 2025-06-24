import { logger } from '@/helper/logger';
import type { ApiDescriptor, ApiPlugin } from '@/type';
/**
 * Filter configuration interface
 */
export interface FilterApiConfig {
  /**
   * Target scope for filtering, defaults to 'url'
   */
  scope?: 'url' | 'tag';

  /**
   * Include rule:
   * - string: target contains this string
   * - RegExp: target matches this pattern
   * - function: custom matching logic
   */
  include?: string | RegExp | ((key: string) => boolean);

  /**
   * Exclude rule:
   * - string: target contains this string
   * - RegExp: target matches this pattern
   * - function: custom matching logic
   */
  exclude?: string | RegExp | ((key: string) => boolean);
}

/**
 * Tests if value matches the specified rule
 */
function isMatch(value: string, match?: string | RegExp | ((key: string) => boolean)): boolean {
  if (!match) return true;

  if (typeof match === 'string') {
    return value.includes(match);
  }

  if (match instanceof RegExp) {
    return match.test(value);
  }

  if (typeof match === 'function') {
    try {
      return match(value);
    } catch {
      return false; // Return false on error to exclude the item
    }
  }

  return false;
}

/**
 * Extracts the corresponding property value from API descriptor based on scope
 */
function getApiProperty(apiDescriptor: ApiDescriptor, scope: 'url' | 'tag'): string {
  switch (scope) {
    case 'url':
      return apiDescriptor.url || '';
    case 'tag':
      // Assume tags exist in tags array, join with comma if multiple tags
      return Array.isArray(apiDescriptor.tags) ? apiDescriptor.tags.join(',') : '';
    default:
      return '';
  }
}

/**
 * Applies filtering rules for a single configuration
 * @param apiDescriptor API descriptor
 * @param config Filter configuration
 * @returns Whether it passes the filter (true means keep, false means filter out)
 */
function applyFilterRule(apiDescriptor: ApiDescriptor, config: FilterApiConfig): boolean {
  const scope = config.scope || 'url';
  const value = getApiProperty(apiDescriptor, scope);

  // Handle include and exclude logic
  const includeMatch = config.include ? isMatch(value, config.include) : true;
  const excludeMatch = config.exclude ? isMatch(value, config.exclude) : false;

  // If both include and exclude are specified, exclude matching items from include
  return includeMatch && !excludeMatch;
}

/**
 * Handles union logic for multiple configurations
 * @param apiDescriptor API descriptor
 * @param configs Configuration array
 * @returns Whether it passes the filter (true means keep, false means filter out)
 */
function combineFilterResults(apiDescriptor: ApiDescriptor, configs: FilterApiConfig[]): boolean {
  // If any configuration matches, keep the API (union logic)
  return configs.some(config => applyFilterRule(apiDescriptor, config));
}

/**
 * Main processing function for filtering API descriptors
 * @param apiDescriptor API descriptor
 * @param configs Configuration array
 * @returns Filtered API descriptor, or null if filtered out
 */
export function filterApiDescriptor(apiDescriptor: ApiDescriptor, configs: FilterApiConfig[]): ApiDescriptor | null {
  if (!apiDescriptor) return null;

  // Use union logic to determine whether to keep the API
  const shouldKeep = combineFilterResults(apiDescriptor, configs);

  return shouldKeep ? apiDescriptor : null;
}

/**
 * Creates a plugin for filtering APIs
 *
 * @param config Filter configuration, can be a single config or array of configs
 * @returns API plugin instance
 *
 * @example
 * ```ts
 * // Only include URLs containing 'user'
 * const userOnlyFilter = apiFilter({
 *   include: 'user'
 * });
 *
 * // Exclude tags containing 'internal'
 * const noInternalFilter = apiFilter({
 *   scope: 'tag',
 *   exclude: 'internal'
 * });
 *
 * // Multi-condition filtering (union)
 * const multiFilter = apiFilter([
 *   { include: 'user' },
 *   { include: 'admin' }
 * ]);
 * ```
 */
export function apiFilter(config: FilterApiConfig | FilterApiConfig[]): ApiPlugin {
  const configs = Array.isArray(config) ? config : [config];

  // Validate configuration
  for (const conf of configs) {
    if (!conf.include && !conf.exclude) {
      throw logger.throwError('at least one of `include` or `exclude` must be specified');
    }
  }

  return {
    name: 'filterApi',
    extends: {
      handleApi: (apiDescriptor: ApiDescriptor) => {
        if (!apiDescriptor) return null;

        return filterApiDescriptor(apiDescriptor, configs);
      }
    }
  };
}

export default apiFilter;
