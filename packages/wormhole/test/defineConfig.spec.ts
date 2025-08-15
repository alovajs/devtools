import type { UserConfig } from '@/type'
import { defineConfig } from '@/defineConfig'
import { ConfigHelper } from '@/helper/config/ConfigHelper'

describe('defineConfig', () => {
  it('should return the config object when passed directly', () => {
    const config: UserConfig = {
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    }
    expect(defineConfig(config)).toBe(config)
  })

  it('should return the config function when passed a function', () => {
    const configFn = () => ({
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    })
    expect(defineConfig(configFn)).toBe(configFn)
  })

  it('should return the promise when passed a promise', async () => {
    const configPromise = Promise.resolve<UserConfig>({
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    })
    expect(defineConfig(configPromise)).toBe(configPromise)
    await expect(configPromise).resolves.toEqual({
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    })
  })
})

describe('configHelper.readUserConfig', () => {
  let configHelper: ConfigHelper

  beforeEach(() => {
    configHelper = ConfigHelper.getInstance()
    // 重置单例实例
    vi.spyOn(ConfigHelper, 'getInstance').mockReturnValue(configHelper)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return the config object when passed directly', async () => {
    const config: UserConfig = {
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    }
    const result = await configHelper.readUserConfig(config)
    expect(result).toEqual(config)
  })

  it('should return the config object when passed a function', async () => {
    const configFn = () => ({
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    })
    const result = await configHelper.readUserConfig(configFn)
    expect(result).toEqual({
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    })
  })

  it('should return the config object when passed a promise', async () => {
    const configPromise = Promise.resolve<UserConfig>({
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    })
    const result = await configHelper.readUserConfig(configPromise)
    expect(result).toEqual({
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    })
  })

  it('should handle async functions correctly', async () => {
    const asyncConfigFn = async () => ({
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    })
    const result = await configHelper.readUserConfig(asyncConfigFn)
    expect(result).toEqual({
      generator: [{
        input: './openapi.json',
        output: './src/api',
      }],
    })
  })
})
