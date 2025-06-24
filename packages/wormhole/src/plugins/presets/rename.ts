import type { ApiDescriptor, ApiPlugin, Parameter } from '@/type';
/**
 * Rename style options
 */
export type RenameStyle = 'camelCase' | 'kebabCase' | 'snakeCase' | 'pascalCase';

/**
 * Rename plugin configuration
 */
export interface RenameConfig {
  /**
   * Target scope for renaming, defaults to 'url'
   */
  scope?: 'url' | 'params' | 'pathParams' | 'data' | 'response';

  /**
   * Matching rule for selective renaming:
   * - string: target contains this string
   * - RegExp: target matches this pattern
   * - function: custom matching logic
   * If not specified, all targets will be processed
   */
  match?: string | RegExp | ((key: string) => boolean);

  /**
   * Naming style to apply
   */
  style?: RenameStyle;

  /**
   * Custom transformation function
   * Will be applied before style transformation
   */
  transform?: (apiDescriptor: ApiDescriptor) => string;
}

function toCamelCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^(.)/, c => c.toLowerCase());
}

function toCase(str: string): string {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z\d])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

function toPascalCase(str: string): string {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^(.)/, c => c.toUpperCase());
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
    return match(value);
  }

  return false;
}

/**
 * Applies renaming rules to the specified value
 * @returns The renamed value, or original value if not matched
 */
function applyRenameRule(value: string, config: RenameConfig, apiDescriptor: ApiDescriptor): string {
  if (!isMatch(value, config.match)) {
    return value;
  }

  if (config.transform) {
    value = config.transform(apiDescriptor);
  }

  if (!config.style) {
    return value;
  }

  switch (config.style) {
    case 'camelCase':
      return toCamelCase(value);
    case 'snakeCase':
      return toCase(value);
    case 'kebabCase':
      return toKebabCase(value);
    case 'pascalCase':
      return toPascalCase(value);
    default:
      throw new Error(`Invalid rename style: ${config.style}`);
  }
}

/**
 * renames URL path by processing each segment individually
 * while keeping path parameter placeholders
 */
function renameUrl(url: string, config: RenameConfig, apiDescriptor: ApiDescriptor): string {
  const segments = url.split('/');
  return segments
    .map(segment => {
      // Skip parameter placeholders and empty segments
      if ((segment.startsWith('{') && segment.endsWith('}')) || !segment) {
        return segment;
      }
      return applyRenameRule(segment, config, apiDescriptor);
    })
    .join('/')
    .replace(/^\/{2,}/g, '/');
}

/**
 * Transforms object properties using the renaming rules
 */
function transformProperties(
  obj: Record<string, any>,
  config: RenameConfig,
  apiDescriptor: ApiDescriptor
): Record<string, any> {
  if (!obj || typeof obj !== 'object' || !('properties' in obj)) {
    return obj;
  }

  const properties = { ...obj.properties };
  const newProperties: Record<string, any> = {};

  for (const key in properties) {
    const newKey = applyRenameRule(key, config, apiDescriptor);
    newProperties[newKey] = properties[key];
  }

  return {
    ...obj,
    properties: newProperties
  };
}

/**
 * Transforms parameters of specific type using the renaming rules
 */
function transformParameters(
  parameters: Array<Parameter>,
  type: 'query' | 'path' | 'header' | 'cookie',
  config: RenameConfig,
  apiDescriptor: ApiDescriptor
): Array<Parameter> {
  if (!parameters || !Array.isArray(parameters)) {
    return parameters;
  }

  return parameters.map(param => {
    if (param.in === type) {
      return {
        ...param,
        name: applyRenameRule(param.name, config, apiDescriptor)
      };
    }
    return param;
  });
}

/**
 * Processes API descriptor based on renaming configuration
 *
 * Each scope targets different parts of the API descriptor:
 * - url: Renames URL path segments
 * - params: Renames query parameters
 * - pathParams: Renames path parameters and their placeholders in URL
 * - data: Renames request body properties
 * - response: Renames response body properties
 */
function renameApiDescriptor(apiDescriptor: ApiDescriptor, config: RenameConfig): ApiDescriptor {
  if (!apiDescriptor) return apiDescriptor;

  const newDescriptor = { ...apiDescriptor };
  const scope = config.scope || 'url';

  switch (scope) {
    case 'params':
      if (newDescriptor.parameters) {
        newDescriptor.parameters = transformParameters(newDescriptor.parameters, 'query', config, apiDescriptor);
      }
      break;

    case 'pathParams':
      if (newDescriptor.parameters) {
        newDescriptor.parameters = transformParameters(newDescriptor.parameters, 'path', config, apiDescriptor);
      }

      if (newDescriptor.url) {
        newDescriptor.url = newDescriptor.url.replace(/{([^}]+)}/g, (match, paramName) => {
          const newName = applyRenameRule(paramName, config, apiDescriptor);
          return `{${newName}}`;
        });
      }
      break;

    case 'data':
      if (newDescriptor.requestBody) {
        newDescriptor.requestBody = transformProperties(newDescriptor.requestBody, config, apiDescriptor);
      }
      break;

    case 'response':
      if (newDescriptor.responses) {
        newDescriptor.responses = transformProperties(newDescriptor.responses, config, apiDescriptor);
      }
      break;

    case 'url':
      if (newDescriptor.url) {
        newDescriptor.url = renameUrl(newDescriptor.url, config, apiDescriptor);
      }
      break;

    default:
      // No action needed, keep original descriptor
      break;
  }

  return newDescriptor;
}

/**
 * Creates a rename plugin that transforms API descriptors
 * according to specified naming rules
 */
export function rename(config: RenameConfig | RenameConfig[]): ApiPlugin {
  const configs = Array.isArray(config) ? config : [config];

  for (const conf of configs) {
    if (!conf.style && !conf.transform) {
      throw new Error('at least one of `style` or `transform` is required');
    }
  }

  return {
    name: 'rename',
    extends: {
      handleApi: (apiDescriptor: ApiDescriptor) => {
        if (!apiDescriptor) return null;

        // Apply each configuration in sequence
        return configs.reduce<ApiDescriptor | null>((desc, conf) => {
          if (!desc) return null;
          return renameApiDescriptor(desc, conf);
        }, apiDescriptor);
      }
    }
  };
}

export default rename;
