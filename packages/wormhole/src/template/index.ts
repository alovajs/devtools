import type HandlebarsType from 'handlebars'
import type { ApiPlugin } from '@/helper/config/type'
import type {
  FunctionalTemplateOptions,
  GlobalsTemplateOptions,
  RequestLibTemplateOptions,
} from '@/helper/config/type'
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

/**
 * Register processType helper on an hbs instance.
 *
 * Scans the type string for every PascalCase identifier that is in componentNames
 * (and not already prefixed with "ComponentTypes.") and prefixes it.
 * Works uniformly for top-level names, generics, object literals, and arrays.
 */
export function registerProcessTypeHelper(hbs: typeof HandlebarsType) {
  hbs.registerHelper('processType', (_typeStr: unknown, _componentNames: unknown) => {
    const typeStr = _typeStr as string
    const componentNames = _componentNames as string[]
    if (!typeStr || !Array.isArray(componentNames) || componentNames.length === 0) {
      return new hbs.SafeString(typeStr || 'unknown')
    }
    const componentSet = new Set(componentNames)
    const result = typeStr.replace(/(?<!ComponentTypes\.)(\b[A-Z]\w*\b)/g, (match) => {
      return componentSet.has(match) ? `ComponentTypes.${match}` : match
    })
    return new hbs.SafeString(result)
  })
}

// ========== Template Preset Plugins ==========

/**
 * alova.config 模板预设 - plugin mode
 */
export function config(): ApiPlugin {
  return {
    name: PluginName.TEMPLATE_CONFIG,
    getTemplate() {
      return { path: getPresetTemplatePath(PresetTemplateName.CONFIG) }
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
        global,
        globalHost,
        useImportType: opts?.useImportType ?? false,
      }
      // Prefix pathKey and defaultValue with global name
      for (const api of data.allApis) {
        api.pathKey = `${global}.${api.pathKey}`
        if (api.defaultValue) {
          api.defaultValue = `${global}.${api.defaultValue}`
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
    onHandlebarsCreated({ hbs }) {
      registerProcessTypeHelper(hbs)
    },
    beforeCodeGenerate({ data }) {
      data.config = {
        ...data.config,
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
    onHandlebarsCreated({ hbs }) {
      registerProcessTypeHelper(hbs)
    },
    beforeCodeGenerate({ data }) {
      data.config = {
        ...data.config,
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
    onHandlebarsCreated({ hbs }) {
      registerProcessTypeHelper(hbs)
    },
    beforeCodeGenerate({ data }) {
      data.config = {
        ...data.config,
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
    onHandlebarsCreated({ hbs }) {
      registerProcessTypeHelper(hbs)
    },
    beforeCodeGenerate({ data }) {
      data.config = {
        ...data.config,
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
