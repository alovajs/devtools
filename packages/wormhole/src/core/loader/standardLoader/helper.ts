const reservedWords = new Set([
  'abstract',
  'arguments',
  'await',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'double',
  'else',
  'enum',
  'eval',
  'export',
  'extends',
  'false',
  'final',
  'finally',
  'float',
  'for',
  'function',
  'goto',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'int',
  'interface',
  'let',
  'long',
  'native',
  'new',
  'null',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'volatile',
  'while',
  'with',
  'yield',
])
export function makeIdentifier(str: string, style: 'camelCas' | 'snakeCase') {
  // Removes all characters that are not letters, numbers, underscores, and dollar signs while splitting words
  const words = str.split(/[^\w$]+/).filter(Boolean)

  // Convert words to camelCase form
  let identifier = ''
  switch (style) {
    case 'camelCas':
      identifier = words
        .map((word, index) => {
          if (index === 0) {
            return word.toLowerCase()
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join('')
      break
    case 'snakeCase':
      identifier = words.join('_').toLowerCase()
      break
    default:
      identifier = words.join('')
      break
  }

  // If the string starts with a number, replace it with an underscore
  if (/^\d/.test(identifier)) {
    identifier = `_${identifier}`
  }

  // If it is a reserved word, add a suffix
  if (reservedWords.has(identifier)) {
    identifier += '_'
  }
  return identifier
}
export function isValidJSIdentifier(str?: string) {
  return !!str && /^[a-z_$][\w$]*$/i.test(str) && !reservedWords.has(str)
}
