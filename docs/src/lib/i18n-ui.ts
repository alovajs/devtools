import type { Translations } from 'fumadocs-ui/i18n'
import type { Locale } from './i18n'

/**
 * fumadocs-ui 内置界面文案的中文翻译。
 *
 * 仅在当前语言为 `zh` 时注入到 RootProvider，英文沿用 fumadocs 默认文案。
 * 键名需与 `fumadocs-ui/i18n` 的 `Translations` 类型保持一致。
 */
export const zhTranslations: Translations = {
  displayName: '中文',
  search: '搜索文档',
  searchNoResult: '未找到相关结果',
  searchOpen: '打开搜索',
  searchClose: '关闭搜索',
  toc: '本页目录',
  tocNoHeadings: '本页暂无标题',
  tocInline: '本页大纲',
  lastUpdate: '最后更新于',
  chooseLanguage: '选择语言',
  nextPage: '下一页',
  previousPage: '上一页',
  chooseTheme: '选择主题',
  editOnGithub: '在 GitHub 上编辑',
  themeToggle: '切换主题',
  themeLight: '浅色',
  themeDark: '深色',
  themeSystem: '跟随系统',
  codeBlockCopy: '复制',
  codeBlockCopied: '已复制',
  accordionCopyAnchor: '复制锚点链接',
  headingCopyAnchor: '复制标题链接',
  bannerClose: '关闭',
  menuToggle: '切换菜单',
  pageActionsCopyMarkdown: '复制 Markdown',
  pageActionsOpen: '更多操作',
  pageActionsOpenGitHub: '在 GitHub 查看',
  pageActionsViewMarkdown: '查看 Markdown',
  pageActionsOpenScira: '在 Scira 中打开',
  pageActionsOpenChatGPT: '在 ChatGPT 中打开',
  pageActionsOpenClaude: '在 Claude 中打开',
  pageActionsOpenCursor: '在 Cursor 中打开',
  // 注意：这是喂给 LLM 的提示词模板，{url} 占位符必须保留，
  // fumadocs 会把当前页地址注入其中（见 page-actions.js 的 renderTranslation）。
  pageActionsOpenInLLMPrompt: '请参考来自 {url} 的文档内容来回答我的问题。',
  sidebarOpen: '打开侧边栏',
  sidebarCollapse: '收起侧边栏',
  typeTableProp: '属性',
  typeTableType: '类型',
  typeTableDefault: '默认值',
  typeTableParameters: '参数',
  typeTableReturns: '返回值',
  notFoundTitle: '页面未找到',
  notFoundDescription: '你访问的页面不存在或已被移动。',
  notFoundLink: '返回首页',
}

/** 按语言返回对应界面翻译；英文使用 fumadocs 默认，无需注入。 */
export function getUiTranslations(locale: Locale): Partial<Translations> | undefined {
  return locale === 'zh' ? zhTranslations : undefined
}
