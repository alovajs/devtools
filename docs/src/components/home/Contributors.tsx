import type { ComponentType } from 'react'
import { Code2, FileText, Globe, Link as LinkIcon, Mail, Newspaper } from 'lucide-react'
import SectionHeader from './SectionHeader'
import SectionLabel from './SectionLabel'

/** GitHub 品牌图标（自定义 SVG，lucide 已移除品牌图标） */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  )
}

export interface ContributorLink {
  /** 链接类型，用于决定默认显示文案，例如 'github' | 'twitter' | 'website' | 'email' */
  type: 'github' | 'twitter' | 'website' | 'email' | (string & {})
  /** 链接地址 */
  url: string
  /** 可选显示文案，未提供时按 type 自动命名 */
  label?: string
}

export interface Contributor {
  /** 展示名称 */
  name: string
  /** 头像图片地址（位于 public 目录下），未提供时展示姓名首字母 */
  avatar?: string
  /** beta 阶段承担的角色 */
  role: string
  /** 主要贡献方向 */
  contributions: string[]
  /** 自定义外部链接，可包含 github / 个人主页 / 社交账号等，按需维护 */
  links: ContributorLink[]
}

/**
 * Beta 阶段贡献者名单。
 *
 * 新增 / 调整贡献者时，只需维护此数组即可，页面会自动渲染。
 * 每位贡献者的链接通过 `links` 数组自定义，不一定指向 GitHub。
 * （当前为示例数据，请替换为真实的 beta 贡献者。）
 */
export const betaContributors: Contributor[] = [
  {
    name: 'Jin Park',
    role: 'Beta 体验官',
    contributions: ['深度使用', 'bug猎手', '体验打磨'],
    links: [
      { type: 'github', url: 'https://github.com/jinpark-dev' },
    ],
  },
  {
    name: '李慕',
    role: 'Beta 体验官',
    contributions: ['深度使用', '改进献策', '细节把关'],
    links: [
      { type: 'github', url: 'https://github.com/limu-dev' },
    ],
  },
  {
    name: 'em_zh_z',
    avatar: '/img/em_zh_z.jpg',
    role: 'Beta 体验官',
    contributions: ['bug猎手', '深度使用'],
    links: [],
  },
]

const defaultLabels: Record<string, string> = {
  github: 'GitHub',
  twitter: 'Twitter',
  website: 'Website',
  email: 'Email',
}

/** 预定义图标：type 命中时展示对应 lucide 图标，未命中的 type 不展示图标 */
const linkIcons: Record<string, ComponentType<{ className?: string }>> = {
  github: GithubIcon,
  website: Globe,
  email: Mail,
  link: LinkIcon,
  blog: Newspaper,
  docs: FileText,
  code: Code2,
}

function getLinkLabel(link: ContributorLink): string {
  if (link.label)
    return link.label
  return defaultLabels[link.type] ?? link.type
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1)
    return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function renderLink(link: ContributorLink) {
  const Icon = linkIcons[link.type]
  return (
    <a
      key={link.url}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-primary)] inline-flex items-center gap-1 font-data-mono text-[11px] transition-colors"
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span>{getLinkLabel(link)}</span>
    </a>
  )
}

export default function Contributors() {
  return (
    <section className="relative my-8 overflow-hidden border border-[var(--color-fd-border)] bg-[var(--color-fd-background)] bg-[radial-gradient(var(--color-fd-border)_1px,transparent_1px)_0_0/40px_40px]">
      <SectionLabel>CONTRIBUTORS // BETA_PHASE</SectionLabel>
      <div className="border-b border-[var(--color-fd-border)] p-8 lg:p-12">
        <SectionHeader label="// 社区贡献者" title="BETA 贡献者" />
        <p className="mt-6 max-w-2xl font-body-md text-sm leading-relaxed text-[var(--color-fd-muted-foreground)]">
          worma 仍处于 beta 阶段，以下伙伴参与了早期的设计、开发与验证。每一项贡献，无论大小，都让虫洞连接更通畅。
        </p>
        <div className="mt-6 font-data-mono text-[10px] tracking-[0.3em] uppercase text-[var(--color-fd-primary)]">
          TOTAL //
          {' '}
          {betaContributors.length}
          {' '}
          CONTRIBUTORS
        </div>
      </div>
      <div className="grid grid-cols-1 gap-px bg-[var(--color-fd-border)] sm:grid-cols-2 lg:grid-cols-3">
        {betaContributors.map(contributor => (
          <div
            key={contributor.name}
            className="group relative flex flex-col gap-4 bg-[var(--color-fd-card)] p-6 transition-colors hover:bg-[var(--color-fd-muted)]"
          >
            <div className="flex items-center gap-4">
              {contributor.avatar
                ? (
                    <img
                      src={contributor.avatar}
                      alt={contributor.name}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  )
                : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center text-lg font-bold uppercase text-[var(--color-fd-primary)] transition-colors font-headline-lg bg-[var(--color-fd-muted)] group-hover:bg-[var(--color-fd-primary)] group-hover:text-[var(--color-fd-primary-foreground)]">
                      {getInitials(contributor.name)}
                    </div>
                  )}
              <div className="min-w-0">
                <div className="truncate font-body-md text-sm font-bold text-[var(--color-fd-foreground)]">
                  {contributor.name}
                </div>
                <div className="font-data-mono text-[10px] uppercase tracking-wider text-[var(--color-fd-primary)]">
                  {contributor.role}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {contributor.contributions.map(area => (
                <span
                  key={area}
                  className="rounded-sm border border-[var(--color-fd-border)] px-2 py-0.5 font-data-mono text-[10px] uppercase tracking-wider text-[var(--color-fd-muted-foreground)]"
                >
                  {area}
                </span>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
              {contributor.links.map(renderLink)}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
