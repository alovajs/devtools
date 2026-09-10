import type { Locale } from '@/lib/i18n'
import Link from 'next/link'
import { localePrefix } from '@/lib/i18n'
import { getHomeDict } from '@/lib/i18n-home'
import Icon from './Icon'
import SectionLabel from './SectionLabel'

const pluginMeta = [
  { name: 'aiDoc', icon: 'psychology' },
  { name: 'rename', icon: 'edit' },
  { name: 'apiFilter', icon: 'filter_list' },
  { name: 'apifox', icon: 'cloud_upload' },
  { name: 'payloadModifier', icon: 'tune' },
] as const

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
            const isFirstRow = index < 3
            return (
              <div
                key={plugin.name}
                className={`p-6 hover:bg-primary transition-all group relative ${isFirstRow ? 'tech-border-b' : ''} ${index !== 2 ? 'tech-border-r' : ''} ${index >= 3 ? 'sm:tech-border-b-0' : ''}`}
              >
                <div className="w-8 h-8 tech-border border-outline group-hover:border-black flex items-center justify-center mb-4">
                  <Icon name={plugin.icon} className="text-base group-hover:text-black" />
                </div>
                <span className="text-on-surface group-hover:text-black font-headline-lg text-sm font-bold uppercase tracking-wider block mb-2">{plugin.name}</span>
                <p className="text-on-surface-variant group-hover:text-black/70 font-data-mono text-[10px] leading-relaxed">{plugin.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
