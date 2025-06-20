import { apiFilter, filterApiDescriptor, type FilterApiConfig } from '@/plugins/presets/filterApi';
import { ApiDescriptor } from '@/type';
import { resolve } from 'node:path';
import { generateWithPlugin } from '../util';

vi.mock('node:fs');
vi.mock('node:fs/promises');

describe('apiFilter plugin tests', () => {
  // Mock API descriptors for testing
  const mockApiDescriptorUser: ApiDescriptor = {
    url: '/user/profile',
    method: 'GET',
    tags: ['user', 'profile'],
    summary: 'Get user profile',
    operationId: 'getUserProfile'
  };

  const mockApiDescriptorAdmin: ApiDescriptor = {
    url: '/admin/dashboard',
    method: 'GET',
    tags: ['admin', 'management'],
    summary: 'Admin dashboard',
    operationId: 'getAdminDashboard'
  };

  const mockApiDescriptorOrder: ApiDescriptor = {
    url: '/order/list',
    method: 'GET',
    tags: ['order', 'public'],
    summary: 'Get order list',
    operationId: 'getOrderList'
  };

  const mockApiDescriptorInternal: ApiDescriptor = {
    url: '/internal/status',
    method: 'GET',
    tags: ['internal', 'monitoring'],
    summary: 'Internal status check',
    operationId: 'getInternalStatus'
  };

  describe('Basic filtering functionality', () => {
    test('should include APIs when URL contains specified string', () => {
      const config: FilterApiConfig = { include: 'user' };

      const result = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(result).toBeDefined();
      expect(result?.url).toBe('/user/profile');

      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, [config]);
      expect(resultAdmin).toBeNull();
    });

    test('should exclude APIs when URL contains specified string', () => {
      const config: FilterApiConfig = { exclude: 'internal' };

      const result = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(result).toBeDefined();
      expect(result?.url).toBe('/user/profile');

      const resultInternal = filterApiDescriptor(mockApiDescriptorInternal, [config]);
      expect(resultInternal).toBeNull();
    });

    test('should handle both include and exclude rules', () => {
      const config: FilterApiConfig = { include: 'admin', exclude: 'internal' };

      // Should include admin but not internal
      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, [config]);
      expect(resultAdmin).toBeDefined();

      const resultInternal = filterApiDescriptor(mockApiDescriptorInternal, [config]);
      expect(resultInternal).toBeNull();

      const resultUser = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(resultUser).toBeNull();
    });

    test('should work with regex patterns', () => {
      const config: FilterApiConfig = { include: /^\/user/ };

      const result = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(result).toBeDefined();

      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, [config]);
      expect(resultAdmin).toBeNull();
    });

    test('should work with function matchers', () => {
      const config: FilterApiConfig = {
        include: (url: string) => url.includes('order') || url.includes('user')
      };

      const resultUser = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(resultUser).toBeDefined();

      const resultOrder = filterApiDescriptor(mockApiDescriptorOrder, [config]);
      expect(resultOrder).toBeDefined();

      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, [config]);
      expect(resultAdmin).toBeNull();
    });
  });

  describe('Different scope tests', () => {
    test('should filter by URL scope (default)', () => {
      const config: FilterApiConfig = { scope: 'url', include: 'user' };

      const result = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(result).toBeDefined();

      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, [config]);
      expect(resultAdmin).toBeNull();
    });

    test('should filter by tag scope', () => {
      const config: FilterApiConfig = { scope: 'tag', include: 'admin' };

      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, [config]);
      expect(resultAdmin).toBeDefined();

      const resultUser = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(resultUser).toBeNull();
    });

    test('should filter by tag scope with multiple tags', () => {
      const config: FilterApiConfig = { scope: 'tag', include: 'profile' };

      const resultUser = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(resultUser).toBeDefined();

      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, [config]);
      expect(resultAdmin).toBeNull();
    });

    test('should exclude by tag scope', () => {
      const config: FilterApiConfig = { scope: 'tag', exclude: 'internal' };

      const resultUser = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(resultUser).toBeDefined();

      const resultInternal = filterApiDescriptor(mockApiDescriptorInternal, [config]);
      expect(resultInternal).toBeNull();
    });

    test('should handle API with no tags when filtering by tag scope', () => {
      const noTagsApi: ApiDescriptor = {
        url: '/no-tags',
        method: 'GET',
        summary: 'API with no tags',
        operationId: 'getNoTags'
      };

      const config: FilterApiConfig = { scope: 'tag', include: 'user' };

      const result = filterApiDescriptor(noTagsApi, [config]);
      expect(result).toBeNull();
    });
  });

  describe('Multiple configuration union logic tests', () => {
    test('should apply union logic with multiple include configs', () => {
      const configs: FilterApiConfig[] = [{ include: 'user' }, { include: 'admin' }];

      // Should include both user and admin APIs
      const resultUser = filterApiDescriptor(mockApiDescriptorUser, configs);
      expect(resultUser).toBeDefined();

      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, configs);
      expect(resultAdmin).toBeDefined();

      // Should exclude order API
      const resultOrder = filterApiDescriptor(mockApiDescriptorOrder, configs);
      expect(resultOrder).toBeNull();
    });

    test('should apply union logic with mixed scope configs', () => {
      const configs: FilterApiConfig[] = [
        { scope: 'url', include: 'user' },
        { scope: 'tag', include: 'public' }
      ];

      // Should include user API (matches URL)
      const resultUser = filterApiDescriptor(mockApiDescriptorUser, configs);
      expect(resultUser).toBeDefined();

      // Should include order API (matches tag)
      const resultOrder = filterApiDescriptor(mockApiDescriptorOrder, configs);
      expect(resultOrder).toBeDefined();

      // Should exclude admin API (no match)
      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, configs);
      expect(resultAdmin).toBeNull();
    });

    test('should apply union logic with include and exclude configs', () => {
      const configs: FilterApiConfig[] = [{ include: 'user' }, { include: 'order', exclude: 'admin' }];

      // Should include user API
      const resultUser = filterApiDescriptor(mockApiDescriptorUser, configs);
      expect(resultUser).toBeDefined();

      // Should include order API
      const resultOrder = filterApiDescriptor(mockApiDescriptorOrder, configs);
      expect(resultOrder).toBeDefined();

      // Should exclude admin API
      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, configs);
      expect(resultAdmin).toBeNull();
    });

    test('should work with complex union conditions', () => {
      const configs: FilterApiConfig[] = [
        { scope: 'tag', include: 'user' },
        { scope: 'url', include: /\/admin/ },
        { include: 'order' }
      ];

      // Should include user API (tag match)
      const resultUser = filterApiDescriptor(mockApiDescriptorUser, configs);
      expect(resultUser).toBeDefined();

      // Should include admin API (URL regex match)
      const resultAdmin = filterApiDescriptor(mockApiDescriptorAdmin, configs);
      expect(resultAdmin).toBeDefined();

      // Should include order API (URL string match)
      const resultOrder = filterApiDescriptor(mockApiDescriptorOrder, configs);
      expect(resultOrder).toBeDefined();

      // Should exclude internal API
      const resultInternal = filterApiDescriptor(mockApiDescriptorInternal, configs);
      expect(resultInternal).toBeNull();
    });
  });

  describe('Edge case tests', () => {
    test('should return null when API descriptor is null', () => {
      const config: FilterApiConfig = { include: 'user' };

      const result = filterApiDescriptor(null as any, [config]);
      expect(result).toBeNull();
    });

    test('should return null when API descriptor is undefined', () => {
      const config: FilterApiConfig = { include: 'user' };

      const result = filterApiDescriptor(undefined as any, config as any);
      expect(result).toBeNull();
    });

    test('should handle empty URL', () => {
      const emptyUrlApi: ApiDescriptor = {
        url: '',
        method: 'GET',
        summary: 'API with empty URL',
        operationId: 'getEmpty'
      };

      const config: FilterApiConfig = { include: 'user' };

      const result = filterApiDescriptor(emptyUrlApi, [config]);
      expect(result).toBeNull();
    });

    test('should handle missing URL property', () => {
      const noUrlApi: ApiDescriptor = {
        method: 'GET',
        summary: 'API with no URL',
        operationId: 'getNoUrl'
      } as ApiDescriptor;

      const config: FilterApiConfig = { include: 'user' };

      const result = filterApiDescriptor(noUrlApi, [config]);
      expect(result).toBeNull();
    });

    test('should handle empty tags array', () => {
      const emptyTagsApi: ApiDescriptor = {
        url: '/empty-tags',
        method: 'GET',
        tags: [],
        summary: 'API with empty tags',
        operationId: 'getEmptyTags'
      };

      const config: FilterApiConfig = { scope: 'tag', include: 'user' };

      const result = filterApiDescriptor(emptyTagsApi, [config]);
      expect(result).toBeNull();
    });

    test('should handle null exclude rule (should include all)', () => {
      const config: FilterApiConfig = { include: 'user', exclude: undefined };

      const result = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(result).toBeDefined();
    });

    test('should handle null include rule with exclude', () => {
      const config: FilterApiConfig = { include: undefined, exclude: 'internal' };

      const result = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(result).toBeDefined();

      const resultInternal = filterApiDescriptor(mockApiDescriptorInternal, [config]);
      expect(resultInternal).toBeNull();
    });
  });

  describe('Error handling tests', () => {
    test('should throw error when neither include nor exclude is specified', () => {
      const config: FilterApiConfig = {};

      expect(() => {
        apiFilter(config);
      }).toThrow('at least one of `include` or `exclude` must be specified');
    });

    test('should throw error for multiple configs when none have include or exclude', () => {
      const configs: FilterApiConfig[] = [{ scope: 'url' }, { scope: 'tag' }];

      expect(() => {
        apiFilter(configs);
      }).toThrow('at least one of `include` or `exclude` must be specified');
    });

    test('should throw error when one config in array is invalid', () => {
      const configs: FilterApiConfig[] = [
        { include: 'user' },
        { scope: 'tag' } // Missing include/exclude
      ];

      expect(() => {
        apiFilter(configs);
      }).toThrow('at least one of `include` or `exclude` must be specified');
    });

    test('should work when at least one valid config exists in single config', () => {
      const config: FilterApiConfig = { include: 'user' };

      expect(() => {
        apiFilter(config);
      }).not.toThrow();
    });

    test('should work when all configs in array are valid', () => {
      const configs: FilterApiConfig[] = [
        { include: 'user' },
        { exclude: 'internal' },
        { scope: 'tag', include: 'admin' }
      ];

      expect(() => {
        apiFilter(configs);
      }).not.toThrow();
    });

    test('should handle function matcher that throws error gracefully', () => {
      const config: FilterApiConfig = {
        include: (url: string) => {
          if (url === '/admin/dashboard') {
            throw new Error('Test error');
          }
          return url.includes('user');
        }
      };

      // Should handle the error gracefully and return false (exclude)
      const result = filterApiDescriptor(mockApiDescriptorAdmin, [config]);
      expect(result).toBeNull();

      // Should work normally for other URLs
      const resultUser = filterApiDescriptor(mockApiDescriptorUser, [config]);
      expect(resultUser).toBeDefined();
    });
  });

  describe('Integration tests', () => {
    test('should filter APIs by URL in real generation process', async () => {
      const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/openapi_300.yaml'), [
        apiFilter({ include: 'pet' })
      ]);

      // Should include APIs with 'pet' in URL
      expect(apiDefinitionsFile).toContain('/pet');
      // Should not include APIs without 'pet' in URL
      expect(apiDefinitionsFile).not.toContain('/store');
      expect(apiDefinitionsFile).not.toContain('/user');
    });

    test('should filter APIs by excluding specific patterns', async () => {
      const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/openapi_300.yaml'), [
        apiFilter({ exclude: 'user' })
      ]);

      // Should exclude APIs with 'user' in URL
      expect(apiDefinitionsFile).not.toContain('/user');
      // Should include other APIs
      expect(apiDefinitionsFile).toContain('/pet');
      expect(apiDefinitionsFile).toContain('/store');
    });

    test('should apply union logic with multiple configs in real generation', async () => {
      const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/openapi_300.yaml'), [
        apiFilter([{ include: 'pet' }, { include: 'store' }])
      ]);

      // Should include both pet and store APIs
      expect(apiDefinitionsFile).toContain('/pet');
      expect(apiDefinitionsFile).toContain('/store');
      // Should exclude user APIs
      expect(apiDefinitionsFile).not.toContain('/user');
    });

    test('should work with regex patterns in real generation', async () => {
      const { apiDefinitionsFile } = await generateWithPlugin(resolve(__dirname, '../openapis/openapi_300.yaml'), [
        apiFilter({ include: /^\/pet/ })
      ]);

      // Should include APIs starting with /pet
      expect(apiDefinitionsFile).toContain('/pet');
      // Should exclude other APIs
      expect(apiDefinitionsFile).not.toContain('/store');
      expect(apiDefinitionsFile).not.toContain('/user');
    });
  });
});
