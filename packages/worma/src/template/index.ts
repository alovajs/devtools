import type { ApiPlugin, FunctionalTemplateOptions, GlobalsTemplateOptions, RequestLibTemplateOptions } from '@/helper/config/type'
import path from 'node:path'
import { PluginName, PresetTemplateName } from '@/constant'

/**
 * 获取预设模板的完整路径
 */
export function getPresetTemplatePath(presetName: string): string {
  // 预设模板在 src/template/presets 目录中
  // 编译后在 dist/template/presets 目录
  return path.join(__dirname, 'presets', presetName)
}

// ========== Template Preset Plugins ==========

/**
 * worma.config 模板预设 - plugin mode
 */
export function config(): ApiPlugin {
  return {
    name: PluginName.TEMPLATE_CONFIG,
    getTemplate() {
      return { path: getPresetTemplatePath(PresetTemplateName.CONFIG) }
    },
    beforeCodeGenerate({ data }) {
      data.config = { ...data.config, templateName: 'config' }
    },
  }
}

/**
 * globals 模板预设 - plugin mode
 * 全局模板，现有的全局模板，通过全局挂载的方式使用
 */
export function alovaGlobals(opts?: GlobalsTemplateOptions): ApiPlugin {
  return {
    name: PluginName.TEMPLATE_ALOVA_GLOBALS,
    getTemplate() {
      return { path: getPresetTemplatePath(PresetTemplateName.GLOBALS) }
    },
    beforeCodeGenerate({ data }) {
      const global = opts?.global ?? 'Apis'
      const globalHost = opts?.globalHost ?? 'globalThis'
      // Inject template config into templateData
      data.config = {
        ...data.config,
        templateName: 'alova-globals',
        global,
        globalHost,
        useImportType: opts?.useImportType ?? false,
      }
      // Prefix callingCode with global.tag for full call chain
      // Also compute apiKey for globals-specific identifiers
      for (const api of data.allApis) {
        const fullKey = `${global}.${api.tag}.${api.name}`;
        (api as any).apiKey = fullKey
        if (api.callingCode) {
          api.callingCode = `${global}.${api.tag}.${api.callingCode}`
        }
      }
    },
  }
}

/**
 * functional 模板预设 - plugin mode
 * 函数式模板，生成函数式API调用，支持tree-shaking，仅支持alova v3
 */
export function alova(opts?: FunctionalTemplateOptions): ApiPlugin {
  return {
    name: PluginName.TEMPLATE_ALOVA,
    getTemplate() {
      return { path: getPresetTemplatePath(PresetTemplateName.ALOVA) }
    },
    beforeCodeGenerate({ data }) {
      data.config = {
        ...data.config,
        templateName: 'alova',
        useImportType: opts?.useImportType ?? false,
      }
    },
  }
}

/**
 * axios 模板预设 - plugin mode
 * Axios相关模板
 */
export function axios(opts?: RequestLibTemplateOptions): ApiPlugin {
  return {
    name: PluginName.TEMPLATE_AXIOS,
    getTemplate() {
      return { path: getPresetTemplatePath(PresetTemplateName.AXIOS) }
    },
    beforeCodeGenerate({ data }) {
      data.config = {
        ...data.config,
        templateName: 'axios',
        useImportType: opts?.useImportType ?? false,
      }
    },
  }
}

/**
 * fetch 模板预设 - plugin mode
 * Fetch相关模板
 */
export function fetch(opts?: RequestLibTemplateOptions): ApiPlugin {
  return {
    name: PluginName.TEMPLATE_FETCH,
    getTemplate() {
      return { path: getPresetTemplatePath(PresetTemplateName.FETCH) }
    },
    beforeCodeGenerate({ data }) {
      data.config = {
        ...data.config,
        templateName: 'fetch',
        useImportType: opts?.useImportType ?? false,
      }
    },
  }
}

/**
 * ky 模板预设 - plugin mode
 * Ky相关模板
 */
export function ky(opts?: RequestLibTemplateOptions): ApiPlugin {
  return {
    name: PluginName.TEMPLATE_KY,
    getTemplate() {
      return { path: getPresetTemplatePath(PresetTemplateName.KY) }
    },
    beforeCodeGenerate({ data }) {
      data.config = {
        ...data.config,
        templateName: 'ky',
        useImportType: opts?.useImportType ?? false,
      }
    },
  }
}

// 导出类型
export type {
  FunctionalTemplateOptions,
  GlobalsTemplateOptions,
  RequestLibTemplateOptions,
}
