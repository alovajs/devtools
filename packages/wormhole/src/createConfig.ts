import type { TemplateType } from '@/type/lib'
import path from 'node:path'
import getAlovaVersion from '@/functions/getAlovaVersion'
import getAutoTemplateType from '@/functions/getAutoTemplateType'
import { templateHelper } from '@/helper'

interface ConfigCreationOptions {
  projectPath?: string
  type?: TemplateType
}

/**
 * Create a templated configuration file.
 * @param options - Configuration file creation options
 * @param options.projectPath - The root path of the project (optional)
 * @param options.type - The template type to use (optional)
 * @returns A promise that resolves when the config is created
 */
function createConfig({ projectPath = '', type }: ConfigCreationOptions = {}) {
  projectPath = path.isAbsolute(projectPath) ? projectPath : path.resolve(process.cwd(), projectPath)
  type = type || getAutoTemplateType(projectPath)
  templateHelper.load({
    type,
    version: getAlovaVersion(projectPath),
  })
  return templateHelper.outputFile({
    fileName: 'alova.config',
    data: {
      type,
      moduleType: templateHelper.getModuleType(),
    },
    output: projectPath,
    root: true,
    hasVersion: false,
  })
}
export default createConfig
