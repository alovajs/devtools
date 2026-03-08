import type { TemplateType } from '@/type/lib'
import path from 'node:path'
import getAutoTemplateType from '@/functions/getAutoTemplateType'
import { GeneratorHelper, templateHelper } from '@/helper'
import { config } from './template'

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
async function createConfig({ projectPath = '', type }: ConfigCreationOptions = {}) {
  projectPath = path.isAbsolute(projectPath)
    ? projectPath
    : path.resolve(process.cwd(), projectPath)
  type = type || getAutoTemplateType(projectPath)

  const templateConfig = await GeneratorHelper.getTemplateConfig(config())
  templateHelper.load({
    type,
    templatePath: templateConfig.path,
    templateConfig: templateConfig.config,
  })

  // Use generateFromTemplateDir for unified template generation
  await templateHelper.generateFromTemplateDir(templateConfig.path, projectPath, {
    type,
    moduleType: templateHelper.getModuleType(),
  })
}
export default createConfig
