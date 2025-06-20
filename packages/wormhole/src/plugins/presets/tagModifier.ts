import type { ApiDescriptor, ApiPlugin } from '@/type';

/**
 * Tag modifier handler function type
 * Receives a tag string and returns the modified tag string, or null/undefined/void to remove the tag
 */
export type ModifierHandler = (tag: string) => string | null | undefined | void;

/**
 * Validates if tag name follows naming conventions
 * @param tag The tag name to validate
 * @returns true if valid, false otherwise
 */
function isValidTagName(tag: string): boolean {
  if (!tag || typeof tag !== 'string') {
    return false;
  }

  const trimmedTag = tag.trim();

  if (!trimmedTag) {
    return false;
  }

  // Basic naming convention: allow letters, numbers, hyphens, underscores and Chinese characters
  const validPattern = /^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/;
  return validPattern.test(trimmedTag);
}

/**
 * Processes tags in the API descriptor
 * @param apiDescriptor The API descriptor
 * @param handler Tag modifier handler function
 * @returns Modified API descriptor
 */
export function processApiTags(apiDescriptor: ApiDescriptor, handler: ModifierHandler): ApiDescriptor {
  if (!apiDescriptor) return apiDescriptor;

  const newDescriptor = { ...apiDescriptor };

  // Check if tags property exists and is an array
  if (!newDescriptor.tags || !Array.isArray(newDescriptor.tags)) {
    return newDescriptor;
  }

  // Process each tag and filter out null/undefined results
  newDescriptor.tags = newDescriptor.tags
    .map((tag: string) => {
      try {
        // Call user provided handler function
        const modifiedTag = handler(tag);

        // If handler returns null/undefined/void, remove this tag
        if (modifiedTag == null) {
          return null;
        }

        // Validate if modified tag follows naming conventions
        if (!isValidTagName(modifiedTag)) {
          return tag; // Keep original tag if invalid
        }

        return modifiedTag.trim(); // Return trimmed modified tag
      } catch {
        return tag; // Return original tag on error
      }
    })
    .filter((tag): tag is string => tag != null); // Filter out null/undefined values

  return newDescriptor;
}

/**
 * Creates a tag modifier plugin
 *
 * @param handler Tag modifier handler function that receives a tag string and returns modified tag or null/undefined/void to remove the tag
 * @returns API plugin instance
 *
 * @example
 * ```ts
 * // Convert all tags to uppercase
 * const upperCasePlugin = tagModifier(tag => tag.toUpperCase());
 *
 * // Add prefix to tags
 * const prefixPlugin = tagModifier(tag => `api-${tag}`);
 *
 * // Remove specific tags
 * const filterPlugin = tagModifier(tag => tag === 'internal' ? null : tag);
 *
 * // Use the plugin
 * export default {
 *   generator: [{
 *     // ...other config
 *     plugins: [upperCasePlugin]
 *   }]
 * };
 * ```
 */
export function tagModifier(handler: ModifierHandler): ApiPlugin {
  if (!handler || typeof handler !== 'function') {
    throw new Error('tagModifier requires a valid handler function');
  }

  return {
    name: 'tagModifier',
    extends: {
      handleApi: (apiDescriptor: ApiDescriptor) => {
        if (!apiDescriptor) return null;

        return processApiTags(apiDescriptor, handler);
      }
    }
  };
}

export default tagModifier;
