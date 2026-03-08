import type {
  FunctionalTemplateOptions,
  GlobalsTemplateOptions,
  RequestLibTemplateOptions,
  TemplateConfig,
  TemplateConfigResult,
} from '@/helper/config/type'
import path from 'node:path'

/**
 * 获取预设模板的完整路径
 */
export function getPresetTemplatePath(presetName: string): string {
  // 预设模板在 src/template/presets 目录中
  // 编译后在 dist/template/presets 目录
  return path.join(__dirname, 'presets', presetName)
}

/**
 * alova.config 模板预设
 */
export function config(): TemplateConfig {
  return () => ({
    path: getPresetTemplatePath('config'),
  })
}

/**
 * globals 模板预设
 * 全局模板，现有的全局模板，通过全局挂载的方式使用
 */
export function alovaGlobals(config?: GlobalsTemplateOptions): TemplateConfig {
  return () => ({
    path: getPresetTemplatePath('alova-globals'),
    config,
  })
}

/**
 * functional 模板预设
 * 函数式模板，生成函数式API调用，支持tree-shaking，仅支持alova v3
 */
export function alovaFunctional(config?: FunctionalTemplateOptions): TemplateConfig {
  return () => ({
    path: getPresetTemplatePath('alova-functional'),
    config,
  })
}

/**
 * axios 模板预设
 * Axios相关模板
 */
export function axios(config?: RequestLibTemplateOptions): TemplateConfig {
  return () => ({
    path: getPresetTemplatePath('axios'),
    config,
  })
}

/**
 * fetch 模板预设
 * Fetch相关模板
 */
export function fetch(config?: RequestLibTemplateOptions): TemplateConfig {
  return () => ({
    path: getPresetTemplatePath('fetch'),
    config,
  })
}

/**
 * ky 模板预设
 * Ky相关模板
 */
export function ky(config?: RequestLibTemplateOptions): TemplateConfig {
  return () => ({
    path: getPresetTemplatePath('ky'),
    config,
  })
}

// 导出类型
export type {
  FunctionalTemplateOptions,
  GlobalsTemplateOptions,
  RequestLibTemplateOptions,
  TemplateConfig,
  TemplateConfigResult,
}
