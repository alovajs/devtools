import type { ModifierHandler } from '@/plugins/presets/tagModifier'
import type { ApiDescriptor } from '@/type'
import { PluginName } from '@/constant'
import { processApiTags, tagModifier } from '@/plugins/presets/tagModifier'

describe('tagModifier plugin tests', () => {
  // Mock API descriptor with tags
  const mockApiDescriptor: ApiDescriptor = {
    url: '/test',
    method: 'GET',
    tags: ['user', 'api', 'management'],
    summary: 'Test API',
    operationId: 'testOperation',
  }

  // Mock API descriptor without tags
  const mockApiDescriptorNoTags: ApiDescriptor = {
    url: '/test',
    method: 'GET',
    summary: 'Test API',
    operationId: 'testOperation',
  }

  // Helper: get handleApi from plugin without running full generator
  function getHandleApi(handler: ModifierHandler) {
    const plugin = tagModifier(handler)
    expect(plugin.name).toBe(PluginName.TAG_MODIFIER)
    const configured = plugin.config!({ config: {} as any })
    return configured.handleApi as (api: ApiDescriptor) => ApiDescriptor | null
  }

  it('should convert tags to uppercase', () => {
    const handler: ModifierHandler = (tag: string) => tag.toUpperCase()

    const result = processApiTags(mockApiDescriptor, handler)

    expect(result).toBeDefined()
    expect(result?.tags).toEqual(['USER', 'API', 'MANAGEMENT'])
  })

  it('should add prefix to tags', () => {
    const handler: ModifierHandler = (tag: string) => `api-${tag}`

    const result = processApiTags(mockApiDescriptor, handler)

    expect(result).toBeDefined()
    expect(result?.tags).toEqual(['api-user', 'api-api', 'api-management'])
  })

  it('should remove tags when handler returns null', () => {
    const handler: ModifierHandler = (tag: string) => (tag === 'api' ? null : tag)

    const result = processApiTags(mockApiDescriptor, handler)

    expect(result).toBeDefined()
    expect(result?.tags).toEqual(['user', 'management'])
  })

  it('should remove tags when handler returns undefined', () => {
    const handler: ModifierHandler = (tag: string) => (tag === 'management' ? undefined : tag)

    const result = processApiTags(mockApiDescriptor, handler)

    expect(result).toBeDefined()
    expect(result?.tags).toEqual(['user', 'api'])
  })

  it('should remove multiple tags', () => {
    const handler: ModifierHandler = (tag: string) => (['api', 'management'].includes(tag) ? null : tag.toUpperCase())

    const result = processApiTags(mockApiDescriptor, handler)

    expect(result).toBeDefined()
    expect(result?.tags).toEqual(['USER'])
  })

  it('should return original descriptor when no tags exist', () => {
    const handler: ModifierHandler = (tag: string) => tag.toUpperCase()

    const result = processApiTags(mockApiDescriptorNoTags, handler)

    expect(result).toBeDefined()
    expect(result?.tags).toBeUndefined()
  })

  it('should keep original tag when transformed tag is invalid', () => {
    const handler: ModifierHandler = (tag: string) => `${tag}@#!` // Add invalid characters

    const result = processApiTags(mockApiDescriptor, handler)

    expect(result).toBeDefined()
    // Should keep original tags because new tags contain invalid characters
    expect(result?.tags).toEqual(['user', 'api', 'management'])
  })

  it('should throw error when handler is not a function', () => {
    expect(() => {
      // @ts-expect-error Intentionally pass non-function parameter for testing
      tagModifier(null)
    }).toThrow('tagModifier requires a valid handler function')
  })

  it('should keep original tag when handler throws error', () => {
    const handler: ModifierHandler = (tag: string) => {
      if (tag === 'api') {
        throw new Error('Test error')
      }
      return tag.toUpperCase()
    }

    const result = processApiTags(mockApiDescriptor, handler)

    expect(result).toBeDefined()
    // user -> USER, api -> api (kept original due to error), management -> MANAGEMENT
    expect(result?.tags).toEqual(['USER', 'api', 'MANAGEMENT'])
  })

  it('should handle empty tags array', () => {
    const apiDescriptorEmptyTags: ApiDescriptor = {
      ...mockApiDescriptor,
      tags: [],
    }

    const handler: ModifierHandler = (tag: string) => tag.toUpperCase()

    const result = processApiTags(apiDescriptorEmptyTags, handler)

    expect(result).toBeDefined()
    expect(result?.tags).toEqual([])
  })

  it('should return null when API descriptor is null', () => {
    const handler: ModifierHandler = (tag: string) => tag.toUpperCase()

    const result = processApiTags(null as any, handler)

    expect(result).toBeNull()
  })

  it('should remove all tags when handler always returns null', () => {
    const handler: ModifierHandler = () => null

    const result = processApiTags(mockApiDescriptor, handler)

    expect(result).toBeDefined()
    expect(result?.tags).toEqual([])
  })

  // ---- 插件装配路径 / 集成测试 ----

  it('handleApi should transform tags through the plugin wiring', () => {
    const handleApi = getHandleApi(t => t.toUpperCase())
    const result = handleApi(mockApiDescriptor)!
    expect(result.tags).toEqual(['USER', 'API', 'MANAGEMENT'])
  })

  it('handleApi should return null when descriptor is null', () => {
    const handleApi = getHandleApi(t => t.toUpperCase())
    expect(handleApi(null as any)).toBeNull()
  })

  // ---- 边界与语义测试 ----

  it('should remove tag when handler returns void', () => {
    const handler: ModifierHandler = () => {}
    const result = processApiTags(mockApiDescriptor, handler)
    expect(result?.tags).toEqual([])
  })

  it('should not mutate the input descriptor', () => {
    const src: ApiDescriptor = { ...mockApiDescriptor, tags: [...mockApiDescriptor.tags!] }
    const result = processApiTags(src, t => t.toUpperCase())
    expect(src.tags).toEqual(['user', 'api', 'management'])
    expect(result.tags).toEqual(['USER', 'API', 'MANAGEMENT'])
  })

  it('should trim transformed tags', () => {
    const handler: ModifierHandler = (tag: string) => ` ${tag.toUpperCase()} `
    const result = processApiTags(mockApiDescriptor, handler)
    expect(result?.tags).toEqual(['USER', 'API', 'MANAGEMENT'])
  })

  it('should accept valid tags with Chinese, underscores and hyphens', () => {
    const handler: ModifierHandler = (tag: string) => `prefix-${tag}-名称`
    const descriptor: ApiDescriptor = { ...mockApiDescriptor, tags: ['a', 'b', 'c'] }
    const result = processApiTags(descriptor, handler)
    expect(result?.tags).toEqual(['prefix-a-名称', 'prefix-b-名称', 'prefix-c-名称'])
  })

  // ---- 生成内容有效性（方案 B：原始非法 tag 兜底剔除）----

  it('should drop original tag when it is invalid and the modification is invalid', () => {
    const descriptor: ApiDescriptor = { ...mockApiDescriptor, tags: ['user.service', 'api', 'management'] }
    const handler: ModifierHandler = (tag: string) => `${tag}@invalid`
    const result = processApiTags(descriptor, handler)
    // 'user.service' 非法，回退到同样非法的原始 tag -> 剔除
    expect(result?.tags).toEqual(['api', 'management'])
  })

  it('should drop original tag when handler throws and original is invalid', () => {
    const descriptor: ApiDescriptor = { ...mockApiDescriptor, tags: ['user.service', 'api'] }
    const handler: ModifierHandler = (tag: string) => {
      if (tag === 'user.service')
        throw new Error('boom')
      return tag.toUpperCase()
    }
    const result = processApiTags(descriptor, handler)
    expect(result?.tags).toEqual(['API'])
  })

  it('should never emit an invalid tag through the plugin wiring', () => {
    const handleApi = getHandleApi((tag: string) => (tag === 'api' ? `${tag}@bad` : tag))
    const descriptor: ApiDescriptor = { ...mockApiDescriptor, tags: ['user.service', 'api', 'management'] }
    const result = handleApi(descriptor)!
    for (const t of result.tags!) {
      expect(t).toMatch(/^[\u4E00-\u9FA5\w-]+$/)
    }
    // 'user.service' 非法被剔除；'api' 回退到合法原始值；'management' 保持不变
    expect(result.tags).toEqual(['api', 'management'])
  })
})
