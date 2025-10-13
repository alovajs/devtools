import type { GeneratorConfig } from '@/type'
import { extendsConfig } from '@/functions/prepareConfig'

/**
 * 扩展生成器配置：
 * 根据传入的 newConfig（对象或函数）与基础 config 生成合并后的配置。
 * 当未提供 newConfig 时，直接回退到原始 config。
 * @param config 基础配置
 * @param newConfig 需要扩展的配置或用于生成扩展配置的函数
 * @returns 合并且标准化后的配置
 */
export function extend(config: GeneratorConfig, newConfig?: Partial<GeneratorConfig> | ((config: GeneratorConfig) => Partial<GeneratorConfig>)) {
  // 根据 newConfig 类型计算扩展配置：函数则调用生成配置，否则直接使用对象；未提供则回退到原始 config
  const pluginExtendsConfig = typeof newConfig === 'function' ? newConfig(config) : (newConfig ?? config)
  // 使用 extendsConfig 进行配置合并与标准化，确保最终结构满足生成器需求
  return extendsConfig(config, pluginExtendsConfig)
}
