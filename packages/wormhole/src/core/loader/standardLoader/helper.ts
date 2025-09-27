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
function splitIntoWords(str: string) {
  const words: string[] = []
  const UPPERCASE_REGEX = /^[A-Z]$/
  const LOWERCASE_OR_DIGIT_REGEX = /^[a-z\d]$/
  const LETTER_REGEX = /[a-z]/i
  const DIGIT_REGEX = /^\d$/
  let currentWord = ''
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    const lastChar = str[i - 1] ?? ''
    const nextChar = str[i + 1] ?? ''
    // 如果遇到非单词字符，结束当前单词
    if (/[^\w$]/.test(char) || ['_'].includes(char)) {
      if (currentWord) {
        words.push(currentWord)
      }
      currentWord = ''
      continue
    }

    const isStartOfCamelCase = !UPPERCASE_REGEX.test(lastChar) && UPPERCASE_REGEX.test(char)
    const isUppercaseFollowedByLowercase = UPPERCASE_REGEX.test(char) && LOWERCASE_OR_DIGIT_REGEX.test(nextChar)
    const isTransitionFromDigitToNonDigit = LETTER_REGEX.test(currentWord) && DIGIT_REGEX.test(lastChar) && !DIGIT_REGEX.test(char)

    if (isStartOfCamelCase || isUppercaseFollowedByLowercase || isTransitionFromDigitToNonDigit) {
      if (currentWord) {
        words.push(currentWord)
      }
      currentWord = char
    }
    else {
      currentWord += char
    }
  }
  if (currentWord) {
    words.push(currentWord)
  }
  return words
}
export function makeIdentifier(str: string, style: 'camelCase' | 'snakeCase') {
  // Removes all characters that are not letters, numbers, underscores, and dollar signs while splitting words
  const words = splitIntoWords(str).filter(Boolean)
  // Convert words to camelCase form
  let identifier = ''
  switch (style) {
    case 'camelCase':
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
