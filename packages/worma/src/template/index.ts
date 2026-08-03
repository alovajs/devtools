import type { ApiPlugin, FunctionalTemplateOptions, GlobalsTemplateOptions, RequestLibTemplateOptions } from '@/helper/config/type'
import path from 'node:path'
import { PluginName, PresetTemplateName } from '@/constant'

/**
 * Get the full path of a preset template
 */
export function getPresetTemplatePath(presetName: string): string {
  // preset templates are in the src/template/presets directory
  // after build they are in the dist/template/presets directory
  return path.join(__dirname, 'presets', presetName)
}

// ========== Template Preset Plugins ==========

/**
 * worma.config template preset - plugin mode
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
 * globals template preset - plugin mode
 * Global template: an existing global template, used via global mounting
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
 * functional template preset - plugin mode
 * Functional template that generates functional API calls, supports tree-shaking, only for alova v3
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
 * axios template preset - plugin mode
 * Axios-related template
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
 * fetch template preset - plugin mode
 * Fetch-related template
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
 * ky template preset - plugin mode
 * Ky-related template
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

// export types
export type {
  FunctionalTemplateOptions,
  GlobalsTemplateOptions,
  RequestLibTemplateOptions,
}
