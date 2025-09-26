export type FileNameCase = 'camelCase' | 'pascalCase' | 'kebabCase' | 'snakeCase' | ((name: string) => string)

/**
 * Transform output filename by the given transformer without changing template filename.
 * Only the part before the first dot is transformed (e.g. transform `globals` in `globals.d`).
 */
export function toCase(name: string, transformer?: FileNameCase): string {
  if (!transformer) {
    return name
  }
  if (typeof transformer === 'function') {
    return transformer(name)
  }

  const [head, ...rest] = name.split('.')
  const words = head
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .split(/\s+/)
    .map(w => w.toLowerCase())

  switch (transformer) {
    case 'camelCase':
      return [
        words.map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(''),
        ...rest,
      ].join('.')
    case 'pascalCase':
      return [words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''), ...rest].join('.')
    case 'kebabCase':
      return [words.join('-'), ...rest].join('.')
    case 'snakeCase':
      return [words.join('_'), ...rest].join('.')
    default:
      return name
  }
}
