/**
 * 规范化语言标签为 BCP 47 标准格式（小写语言代码 + 大写地区代码 + 连字符分隔）
 * @param locale 原始语言标签（如 'zh_cn', 'ZH-CN', 'zh-cn'）
 * @returns 规范化后的语言标签（如 'zh-CN'）
 */
export function normalizeLocale(locale: string): string {
  // 1. 替换所有下划线为连字符（统一分隔符）
  const normalized = locale.replace(/_/g, '-')

  // 2. 分割为子标签数组（按连字符分割）
  const parts = normalized.split('-')

  if (parts.length === 0) {
    return locale // 空输入直接返回
  }

  // 3. 处理语言代码（第一个子标签，强制小写）
  parts[0] = parts[0].toLowerCase()

  // 4. 处理地区代码（第二个子标签，若存在且为 2 位字母则大写）
  if (parts.length >= 2) {
    const region = parts[1]
    // 仅处理 2 位字母的地区代码（如 'CN'、'US'）
    if (/^[A-Z]{2}$/i.test(region)) {
      parts[1] = region.toUpperCase()
    }
  }

  // 5. 重新组合子标签（保留后续子标签，如脚本、变体）
  return parts.join('-')
}
