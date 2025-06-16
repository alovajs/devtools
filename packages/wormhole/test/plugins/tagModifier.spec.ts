import { ApiDescriptor } from '~/index';
import { processApiTags, tagModifier, type ModifierHandler } from '../../src/plugins/presets/tagModifier';

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

    const result = processApiTags(mockApiDescriptor, handler);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual(['USER', 'API', 'MANAGEMENT']);
  });

  test('should add prefix to tags', () => {
    const handler: ModifierHandler = (tag: string) => `api-${tag}`;

    const result = processApiTags(mockApiDescriptor, handler);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual(['api-user', 'api-api', 'api-management']);
  });

  test('should remove tags when handler returns null', () => {
    const handler: ModifierHandler = (tag: string) => (tag === 'api' ? null : tag);

    const result = processApiTags(mockApiDescriptor, handler);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual(['user', 'management']);
  });

  test('should remove tags when handler returns undefined', () => {
    const handler: ModifierHandler = (tag: string) => (tag === 'management' ? undefined : tag);

    const result = processApiTags(mockApiDescriptor, handler);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual(['user', 'api']);
  });

  test('should remove multiple tags', () => {
    const handler: ModifierHandler = (tag: string) => (['api', 'management'].includes(tag) ? null : tag.toUpperCase());

    const result = processApiTags(mockApiDescriptor, handler);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual(['USER']);
  });

  test('should return original descriptor when no tags exist', () => {
    const handler: ModifierHandler = (tag: string) => tag.toUpperCase();

    const result = processApiTags(mockApiDescriptorNoTags, handler);

    expect(result).toBeDefined();
    expect(result?.tags).toBeUndefined();
  });

  test('should keep original tag when transformed tag is invalid', () => {
    const handler: ModifierHandler = (tag: string) => `${tag}@#!`; // Add invalid characters

    const result = processApiTags(mockApiDescriptor, handler);

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

    const result = processApiTags(mockApiDescriptor, handler);

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

    const result = processApiTags(apiDescriptorEmptyTags, handler);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual([]);
  });

  test('should return null when API descriptor is null', () => {
    const handler: ModifierHandler = (tag: string) => tag.toUpperCase();

    const result = processApiTags(null as any, handler);

    expect(result).toBeNull();
  });

  test('should remove all tags when handler always returns null', () => {
    const handler: ModifierHandler = () => null;

    const result = processApiTags(mockApiDescriptor, handler);

    expect(result).toBeDefined();
    expect(result?.tags).toEqual([]);
  });
});
