import type { TemplateType } from '@/type/lib'
import path from 'node:path'
import { PresetTemplateName } from '@/constant'
import getAutoTemplateType from '@/functions/getAutoTemplateType'
import { templateHelper } from '@/helper'
import { getPresetTemplatePath } from './template'

export type TemplatePreset = 'alova' | 'alovaGlobals' | 'axios' | 'fetch' | 'ky'

interface ConfigCreationOptions {
  projectPath?: string
  type?: TemplateType
  template?: TemplatePreset
}

const TEMPLATE_PRESET_MAP: Record<TemplatePreset, { importName: string, call: string, presetName: string }> = {
  alovaGlobals: { importName: 'alovaGlobals', call: 'alovaGlobals()', presetName: PresetTemplateName.GLOBALS },
  [PresetTemplateName.ALOVA]: { importName: 'alova', call: 'alova()', presetName: PresetTemplateName.ALOVA },
  [PresetTemplateName.AXIOS]: { importName: 'axios', call: 'axios()', presetName: PresetTemplateName.AXIOS },
  [PresetTemplateName.FETCH]: { importName: 'fetch', call: 'fetch()', presetName: PresetTemplateName.FETCH },
  [PresetTemplateName.KY]: { importName: 'ky', call: 'ky()', presetName: PresetTemplateName.KY },
}

async function createConfig({ projectPath = '', type, template = PresetTemplateName.ALOVA }: ConfigCreationOptions = {}) {
  projectPath = path.isAbsolute(projectPath)
    ? projectPath
    : path.resolve(process.cwd(), projectPath)
  type = type || await getAutoTemplateType(projectPath)

  const preset = TEMPLATE_PRESET_MAP[template]
  const templatePath = getPresetTemplatePath(PresetTemplateName.CONFIG)
  templateHelper.load({
    type,
    templatePath,
  })

  // generateFromTemplateDir now writes files internally
  await templateHelper.generateFromTemplateDir(templatePath, projectPath, {
    type,
    moduleType: templateHelper.getModuleType(),
    templateImport: preset.importName,
    templateCall: preset.call,
  } as any)
}
export default createConfig
