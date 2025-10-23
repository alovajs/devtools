import type { ApiPlugin } from '@/type'

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

export function importType(config: Record<string, string[]>): ApiPlugin {
  // Precompute import lines and excluded identifiers
  const entries = Object.entries(config)
  const excludedTypeNames = Array.from(new Set(entries.flatMap(([, names]) => names)))
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
    name: 'importType',
    config(cfg) {
      cfg.externalTypes = Array.from(new Set([...(cfg.externalTypes ?? []), ...excludedTypeNames]))
      return cfg
    },
    async beforeCodeGenerate(_, __, ctx) {
      if (ctx.fileName === 'globals.d' && entries.length > 0) {
        const content = await ctx.renderTemplate()
        // Insert imports after commentText header while keeping formatting stable
        return insertAfterLeadingBlockComments(content, importLines)
      }
    },
  }
}

export default importType
