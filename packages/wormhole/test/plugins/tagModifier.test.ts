import { tagModifier, type ModifierHandler } from '../../src/plugins/presets/tagModifier';
import type { ApiDescriptor } from '../../src/type/base';

describe('tagModifier plugin tests', () => {
  // Mock API descriptor with tags
  const mockApiDescriptor: ApiDescriptor = {
    url: '/test',
    method: 'GET',
    tags: ['user', 'api', 'management'],
    summary: 'Test API',
    operationId: 'testOperation'
  };

  // Mock API descriptor without tags
  const mockApiDescriptorNoTags: ApiDescriptor = {
    url: '/test',
    method: 'GET',
    summary: 'Test API',
    operationId: 'testOperation'
  };

  test('should convert tags to uppercase', () => {
    const handler: ModifierHandler = (tag: string) => tag.toUpperCase();
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(mockApiDescriptor);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual(['USER', 'API', 'MANAGEMENT']);
  });

  test('should add prefix to tags', () => {
    const handler: ModifierHandler = (tag: string) => `api-${tag}`;
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(mockApiDescriptor);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual(['api-user', 'api-api', 'api-management']);
  });

  test('should remove tags when handler returns null', () => {
    const handler: ModifierHandler = (tag: string) => (tag === 'api' ? null : tag);
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(mockApiDescriptor);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual(['user', 'management']);
  });

  test('should remove tags when handler returns undefined', () => {
    const handler: ModifierHandler = (tag: string) => (tag === 'management' ? undefined : tag);
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(mockApiDescriptor);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual(['user', 'api']);
  });

  test('should remove multiple tags', () => {
    const handler: ModifierHandler = (tag: string) => (['api', 'management'].includes(tag) ? null : tag.toUpperCase());
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(mockApiDescriptor);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual(['USER']);
  });

  test('should return original descriptor when no tags exist', () => {
    const handler: ModifierHandler = (tag: string) => tag.toUpperCase();
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(mockApiDescriptorNoTags);

    expect(result).toBeDefined();
    expect(result?.tags).toBeUndefined();
  });

  test('should keep original tag when transformed tag is invalid', () => {
    const handler: ModifierHandler = (tag: string) => `${tag}@#!`; // Add invalid characters
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(mockApiDescriptor);

    expect(result).toBeDefined();
    // Should keep original tags because new tags contain invalid characters
    expect(result?.tags).toEqual(['user', 'api', 'management']);
  });

  test('should throw error when handler is not a function', () => {
    expect(() => {
      // @ts-ignore Intentionally pass non-function parameter for testing
      tagModifier(null);
    }).toThrow('tagModifier requires a valid handler function');
  });

  test('should keep original tag when handler throws error', () => {
    const handler: ModifierHandler = (tag: string) => {
      if (tag === 'api') {
        throw new Error('Test error');
      }
      return tag.toUpperCase();
    };
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(mockApiDescriptor);

    expect(result).toBeDefined();
    // user -> USER, api -> api (kept original due to error), management -> MANAGEMENT
    expect(result?.tags).toEqual(['USER', 'api', 'MANAGEMENT']);
  });

  test('should handle empty tags array', () => {
    const apiDescriptorEmptyTags: ApiDescriptor = {
      ...mockApiDescriptor,
      tags: []
    };

    const handler: ModifierHandler = (tag: string) => tag.toUpperCase();
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(apiDescriptorEmptyTags);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual([]);
  });

  test('should return null when API descriptor is null', () => {
    const handler: ModifierHandler = (tag: string) => tag.toUpperCase();
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(null as any);

    expect(result).toBeNull();
  });

  test('should remove all tags when handler always returns null', () => {
    const handler: ModifierHandler = () => null;
    const plugin = tagModifier(handler);

    const result = plugin.handleApi?.(mockApiDescriptor);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual([]);
  });
});
