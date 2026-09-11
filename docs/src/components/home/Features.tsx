import type { Locale } from '@/lib/i18n'
import { getHomeDict } from '@/lib/i18n-home'

const featureClasses = [
  'p-8 md:tech-border-r tech-border-b lg:tech-border-b-0 hover:bg-surface-variant/30 transition-colors relative group',
  'p-8 md:tech-border-r-0 lg:tech-border-r tech-border-b lg:tech-border-b-0 hover:bg-surface-variant/30 transition-colors relative group',
  'p-8 md:tech-border-r tech-border-b md:tech-border-b-0 hover:bg-surface-variant/30 transition-colors relative group',
  'p-8 hover:bg-surface-variant/30 transition-colors relative group',
]

export default function Features({ lang }: { lang: Locale }) {
  const t = getHomeDict(lang)
  const features = t.features.items

  return (
    <section className="tech-border-b">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <div key={feature.tag} className={featureClasses[index]}>
            <div className="absolute top-0 right-0 p-2 text-[9px] text-outline font-data-mono group-hover:text-primary">
              0x0
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="font-data-mono text-[10px] text-primary mb-6 uppercase tracking-[0.3em]">
              {String(index + 1).padStart(2, '0')}
              {' '}
              //
              {' '}
              {feature.tag}
            </div>
            <h3 className="font-headline-lg text-2xl text-on-background mb-4 uppercase font-bold tracking-tight">{feature.title}</h3>
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
