import type { ApiPlugin } from '@/type'
import { PluginName } from '@/constant'

// Reusable helper: insert text after leading block comment(s) at file top
const LEADING_BLOCK_COMMENTS = /^\s*(?:\/\*[\s\S]*?\*\/\s*)+/
function insertAfterLeadingBlockComments(content: string, insertion: string) {
  const match = content.match(LEADING_BLOCK_COMMENTS)
  const insertAt = match ? match[0].length : 0
  if (insertAt === 0) {
    return `${insertion}\n${content}`
  }
  const prefix = content.slice(0, insertAt)
  const suffix = content.slice(insertAt)
  const safePrefix = prefix.endsWith('\n') ? prefix : `${prefix}\n`
  return `${safePrefix}${insertion}\n${suffix}`
}

export interface ImportTypeOptions {
  imports: Record<string, string[]>
  files?: string[]
}

export function importType(imports: Record<string, string[]>, options?: { files?: string[] }): ApiPlugin {
  const entries = Object.entries(imports)
  const excludedTypeNames = Array.from(new Set(entries.flatMap(([, names]) => names)))
  const targetFiles = options?.files ?? ['globals.d']

  const importLines = entries
    .map(([key, names]) => {
      const [specifier, ...flags] = key.split('|')
      const isTypeImport = flags.includes('type')
      const kw = isTypeImport ? 'import type' : 'import'
      const named = names.join(', ')
      return `${kw} { ${named} } from '${specifier}'`
    })
    .join('\n')

  return {
    name: PluginName.IMPORT_TYPE,
    config({ config: cfg }) {
      cfg.externalTypes = Array.from(new Set([...(cfg.externalTypes ?? []), ...excludedTypeNames]))
      return cfg
    },
    // 9.1.2: Use beforeFileWrite to modify individual file content before write
    beforeFileWrite({ filePath, content }) {
      if (entries.length === 0)
        return content

      const matched = targetFiles.some(target => filePath.includes(target))
      if (matched) {
        return insertAfterLeadingBlockComments(content, importLines)
      }
      return content
    },
  }
}

export default importType
