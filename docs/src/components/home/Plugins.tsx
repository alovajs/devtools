import type { Locale } from '@/lib/i18n'
import Image from 'next/image'
import Link from 'next/link'
import { localePrefix } from '@/lib/i18n'
import { getHomeDict } from '@/lib/i18n-home'
import Icon from './Icon'
import SectionLabel from './SectionLabel'

/**
 * 插件卡片定义（数组顺序即网格展示顺序，按行填充）。
 *
 * - `icon`：Material Symbols 图标名（功能型插件，以及暂无品牌矢量的插件）；
 * - `img`：`/public/img` 下的品牌 SVG（保留官方品牌色），展示时统一滤镜为白色，hover 转黑；
 * - `href`：点击卡片跳转的文档页（不含语言前缀）。
 */
interface PluginMeta {
  name: string
  icon: string
  href: string
  img?: string
}

const pluginMeta: PluginMeta[] = [
  { name: 'aiDoc', icon: 'psychology', href: '/docs/ai-skills' },
  { name: 'rename', icon: 'edit', href: '/docs/plugin-system/builtin-plugins/rename' },
  { name: 'apiFilter', icon: 'filter_list', href: '/docs/plugin-system/builtin-plugins/filter-api' },
  { name: 'payloadModifier', icon: 'tune', href: '/docs/plugin-system/builtin-plugins/payload-modifier' },
  { name: 'swagger', icon: 'api', href: '/docs/plugin-system/builtin-plugins/platform', img: '/img/swagger.svg' },
  { name: 'postman', icon: 'send', href: '/docs/plugin-system/builtin-plugins/platform', img: '/img/postman.svg' },
  { name: 'apifox', icon: 'cloud_upload', href: '/docs/plugin-system/builtin-plugins/platform', img: '/img/apifox.svg' },
  // Knife4j 官方未提供矢量 Logo，沿用 Material Symbols 保持视觉统一
  { name: 'knife4j', icon: 'menu_book', href: '/docs/plugin-system/builtin-plugins/platform' },
  { name: 'yapi', icon: 'storage', href: '/docs/plugin-system/builtin-plugins/platform', img: '/img/yapi.svg' },
]

/** 卡片网格列数（`sm` 及以上），用于计算单元格边框。 */
const GRID_COLS = 3

export default function Plugins({ lang }: { lang: Locale }) {
  const t = getHomeDict(lang)
  const pluginDesc = Object.fromEntries(t.plugins.items.map(p => [p.name, p.desc]))
  const plugins = pluginMeta.map(meta => ({ ...meta, desc: pluginDesc[meta.name] ?? '' }))

  return (
    <section className="tech-border-b">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="p-8 lg:p-12 lg:tech-border-r flex flex-col justify-center relative bg-surface">
          <SectionLabel>EXT_REGISTRY</SectionLabel>
          <h2 className="font-headline-lg text-4xl text-on-background mb-4 uppercase font-bold tracking-tighter">{t.plugins.title}</h2>
          <p className="font-body-md text-sm text-on-surface-variant mb-10 leading-relaxed">
            {t.plugins.desc}
          </p>
          <Link className="inline-flex items-center gap-3 text-primary hover:text-white transition-colors font-data-mono text-xs uppercase tracking-widest" href={`${localePrefix(lang)}/docs/plugin-system`}>
            {t.plugins.viewAll}
            {' '}
            <Icon name="arrow_forward" className="text-sm" />
          </Link>
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3">
          {plugins.map((plugin, index) => {
            const isLastRow = index >= plugins.length - GRID_COLS
            const isLastCol = (index + 1) % GRID_COLS === 0
            const isVeryLast = index === plugins.length - 1
            // 边框：桌面端最后一行不加下边框、最后一列不加右边框；移动端为单列，
            // 仅最后一项不加下边框。各分支互斥，避免 tech-border-b 与 -b-0 互相覆盖。
            const cellClass = [
              'p-6 hover:bg-primary transition-all group relative block',
              isVeryLast ? '' : (isLastRow ? 'max-sm:tech-border-b' : 'tech-border-b'),
              isLastCol ? '' : 'sm:tech-border-r',
            ].filter(Boolean).join(' ')

            return (
              <Link key={plugin.name} href={`${localePrefix(lang)}${plugin.href}`} className={cellClass}>
                <Icon
                  name="north_east"
                  className="absolute right-4 top-4 text-xs text-on-surface-variant opacity-0 transition-opacity group-hover:text-black group-hover:opacity-100"
                />
                <div className="w-8 h-8 tech-border border-outline group-hover:border-black flex items-center justify-center mb-4">
                  {plugin.img
                    ? (
                        // 品牌 SVG 保留官方颜色，默认用 filter 统一成白色，hover 再压黑
                        <Image
                          src={plugin.img}
                          alt=""
                          width={18}
                          height={18}
                          className="transition-all brightness-0 invert group-hover:invert-0"
                        />
                      )
                    : <Icon name={plugin.icon} className="text-base group-hover:text-black" />}
                </div>
                <span className="text-on-surface group-hover:text-black font-headline-lg text-sm font-bold uppercase tracking-wider block mb-2">{plugin.name}</span>
                <p className="text-on-surface-variant group-hover:text-black/70 font-data-mono text-[10px] leading-relaxed">{plugin.desc}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
