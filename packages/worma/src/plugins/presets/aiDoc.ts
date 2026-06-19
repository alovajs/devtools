import type { ApiPlugin, TemplateData } from '@/type'
import path from 'node:path'
import { PluginName, PresetTemplateName } from '@/constant'
import { TemplateHelper } from '@/helper/template'
import { getPresetTemplatePath } from '@/template'

export interface AiDocConfig {
  template?: string
  outputDir?: string
}

export function aiDoc(config?: AiDocConfig): ApiPlugin {
  const outputDirName = config?.outputDir ?? 'aidocs'
  const customTemplatePath = config?.template

  let capturedOutput = ''
  let capturedServerName = ''

  return {
    name: PluginName.AI_DOC,
    config({ config: generatorConfig }) {
      capturedOutput = generatorConfig.output ?? ''
      capturedServerName = generatorConfig.serverName ?? ''
      return generatorConfig
    },
    // codeGenerated now receives outputDir directly, called after all files are written
    async codeGenerated({ error, data: templateData, projectPath, outputDir }) {
      if (error)
        return

      if (!templateData)
        return

      const outputBase = outputDir || path.resolve(projectPath, capturedOutput)
      const aidocsDir = path.resolve(outputBase, outputDirName)

      const templatePath = customTemplatePath
        ? (path.isAbsolute(customTemplatePath) ? customTemplatePath : path.resolve(projectPath, customTemplatePath))
        : getPresetTemplatePath(PresetTemplateName.AI_DOC)

      const serverName = capturedServerName || templateData.title || 'API'

      // Compute file location for each API (relative path from project root to generated file)
      const outputRel = path.relative(projectPath, outputBase)
      const enrichedData: TemplateData = {
        ...templateData,
        allApis: templateData.allApis.map(api => ({
          ...api,
          // Store the generated file location where this API's code lives
          fileLocation: `./${outputRel}/${api.tag}`,
        })),
        tagedApis: templateData.tagedApis.map(group => ({
          ...group,
          apis: group.apis.map(api => ({
            ...api,
            fileLocation: `./${outputRel}/${group.tagName}`,
          })),
        })),
      }

      const templateHelper = TemplateHelper.load({
        type: templateData.type,
        templatePath,
      })

      const renderData: Record<string, any> = {
        ...enrichedData,
        serverName,
      }

      await templateHelper.generateFromTemplateDir(templatePath, aidocsDir, renderData as TemplateData)
    },
  }
}

export default aiDoc
