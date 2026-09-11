import type { Locale } from '@/lib/i18n'
import Image from 'next/image'
import Link from 'next/link'
import { localePrefix } from '@/lib/i18n'
import { getHomeDict } from '@/lib/i18n-home'
import { gitConfig } from '@/lib/shared'
import SectionLabel from './SectionLabel'

const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`
const releasesUrl = `${githubUrl}/releases`

export default function Footer({ lang }: { lang: Locale }) {
  const t = getHomeDict(lang)
  const base = localePrefix(lang)
  const L = t.footer.links

  const links = [
    {
      title: t.footer.resources,
      items: [
        { label: L.documentation, href: `${base}/docs` },
        { label: L.contributing, href: `${base}/docs/contributing` },
        { label: L.examples, href: 'https://stackblitz.com/fork/github/alovajs/devtools/tree/main/examples/typescript' },
      ],
    },
    {
      title: t.footer.project,
      items: [
        { label: L.changelog, href: releasesUrl },
        { label: L.releases, href: releasesUrl },
        { label: L.coreEngine, href: `${base}/docs/api/core-functions` },
      ],
    },
    {
      title: t.footer.community,
      items: [
        { label: L.github, href: githubUrl },
        { label: L.wechat, href: '#' },
      ],
    },
  ]

  return (
    <footer className="bg-background tech-border mt-12 border-t">
      <div className="tech-border-x relative grid grid-cols-1 mx-auto max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        <SectionLabel>END_OF_TRANSMISSION</SectionLabel>
        <div className="flex flex-col">
          <div className="font-headline-lg text-primary mb-6 flex items-center gap-2 text-3xl font-bold tracking-tighter uppercase">
            <Image src="/img/logo.svg" alt="worma" width={28} height={28} className="h-7 w-7" />
            worma
          </div>
          <div className="font-data-mono text-on-surface-variant text-[10px] tracking-[0.2em]">
            ©
            {' '}
            {new Date().getFullYear()}
            {' '}
            WORMA AND CONTRIBUTIONS.
            <br />
            ALL RIGHTS RESERVED.
          </div>
        </div>
        {links.map(group => (
          <div key={group.title} className="flex flex-col gap-6">
            <span className="font-data-mono text-primary text-[10px] tracking-[0.3em] uppercase">{group.title}</span>
            <div className="flex flex-col gap-3">
              {group.items.map(item => (
                <Link
                  key={item.label}
                  className="font-data-mono text-on-surface-variant text-xs transition-colors hover:text-white"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  )
}
