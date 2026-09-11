import type { Locale } from '@/lib/i18n'
import Image from 'next/image'
import { getHomeDict } from '@/lib/i18n-home'
import Icon from './Icon'
import SectionHeader from './SectionHeader'
import SectionLabel from './SectionLabel'

const sourceLangs = [
  { name: 'Java', icon: '/img/java.svg' },
  { name: 'Go', icon: '/img/golang.svg' },
  { name: 'Python', icon: '/img/Python.svg' },
  { name: 'Node.js', icon: '/img/nodejs_alt.svg' },
]

const outputLibs = [
  { name: 'alova', icon: '/img/alova.svg' },
  { name: 'axios', icon: '/img/axios.svg' },
  { name: 'ky', icon: '/img/ky.svg' },
  { name: 'fetch', icon: '/img/fetch.svg' },
]

export default function Matrix({ lang }: { lang: Locale }) {
  const t = getHomeDict(lang)

  return (
    <section className="tech-border-b bg-background relative overflow-hidden">
      <SectionLabel>ADAPTATION_MATRIX_V1</SectionLabel>
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-4 p-8 lg:p-12 lg:tech-border-r flex flex-col justify-center relative">
          <SectionHeader label="05 // COMPATIBILITY" title={t.matrix.title} />
          <p className="font-body-md text-sm text-on-surface-variant leading-relaxed mt-6">
            {t.matrix.desc}
          </p>
        </div>
        <div className="lg:col-span-8 p-8 lg:p-12 bg-surface/30 flex items-center justify-center">
          <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-3xl gap-8">
            <div className="flex flex-col gap-2 w-40">
              {sourceLangs.map(sl => (
                <div key={sl.name} className="flex items-center gap-3 p-2 tech-border bg-background font-data-mono text-[10px] text-on-surface-variant">
                  <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                    <Image src={sl.icon} alt={sl.name} width={26} height={26} className="object-contain size-auto" />
                  </div>
                  <span>{sl.name}</span>
                </div>
              ))}
            </div>
            <div className="relative flex items-center justify-center">
              <div className="hidden md:block absolute -left-12 w-12 h-[1px] bg-outline" />
              <div className="w-20 h-20 tech-border border-primary flex flex-col items-center justify-center bg-background relative group">
                <Image src="/img/logo.svg" alt="worma" width={20} height={20} className="w-5 h-5 mt-0.5" />
              </div>
              <div className="hidden md:block absolute -right-12 w-12 h-[1px] bg-outline" />
            </div>
            <div className="grid grid-cols-2 gap-2 w-56">
              {outputLibs.map((lib, index) => (
                <div
                  key={lib.name}
                  className={`flex items-center gap-2 p-2 tech-border bg-background font-data-mono text-[10px] ${index === 0 ? 'text-primary' : 'text-on-surface-variant'}`}
                >
                  <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                    <Image src={lib.icon} alt={lib.name} width={24} height={24} className="object-contain size-auto" />
                  </div>
                  <span>{lib.name}</span>
                </div>
              ))}
              <div className="col-span-2 flex items-center gap-2 p-2 tech-border bg-primary/10 border-primary/30 font-data-mono text-[10px] text-primary">
                <Icon name="extension" className="text-xs" />
                <span>{t.matrix.customTemplate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
