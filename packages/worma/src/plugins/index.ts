export * from './createPlugin'
export * from './presets/aiDoc'
export * from './presets/apifox'
export * from './presets/filterApi'
export * from './presets/importType'
export * from './presets/payloadModifier'
export * from './presets/platform'
export * from './presets/rename'
export * from './presets/tagModifier'

// Template preset plugins
export {
  alova,
  alovaGlobals,
  axios,
  config,
  fetch,
  type FunctionalTemplateOptions,
  type GlobalsTemplateOptions,
  ky,
  type RequestLibTemplateOptions,
} from '@/template'
