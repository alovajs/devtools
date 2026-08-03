/**
 * Normalize a locale tag to the BCP 47 standard format (lowercase language code + uppercase region code + hyphen separator)
 * @param locale the original locale tag (e.g. 'zh_cn', 'ZH-CN', 'zh-cn')
 * @returns the normalized locale tag (e.g. 'zh-CN')
 */
export function normalizeLocale(locale: string): string {
  // 1. replace all underscores with hyphens (unify the separator)
  const normalized = locale.replace(/_/g, '-')

  // 2. split into sub-tag array (split by hyphen)
  const parts = normalized.split('-')

  if (parts.length === 0) {
    return locale // return empty input directly
  }

  // 3. process the language code (first sub-tag, force lowercase)
  parts[0] = parts[0].toLowerCase()

  // 4. process the region code (second sub-tag; uppercase if present and is a 2-letter code)
  if (parts.length >= 2) {
    const region = parts[1]
    // only process 2-letter region codes (e.g. 'CN', 'US')
    if (/^[A-Z]{2}$/i.test(region)) {
      parts[1] = region.toUpperCase()
    }
  }

  // 5. recombine the sub-tags (preserve trailing sub-tags such as script, variant)
  return parts.join('-')
}
