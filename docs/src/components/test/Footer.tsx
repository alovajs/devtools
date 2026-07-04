import Image from 'next/image'
import { gitConfig } from '@/lib/shared'
import SectionLabel from './SectionLabel'

const githubUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}`
const releasesUrl = `${githubUrl}/releases`

const links = [
  {
    title: 'Resources',
    items: [
      { label: 'Documentation', href: '/docs' },
      { label: 'GitHub Repository', href: githubUrl },
      { label: 'Examples', href: '/docs/quick-start' },
    ],
  },
  {
    title: 'Project',
    items: [
      { label: 'Changelog', href: releasesUrl },
      { label: 'Releases', href: releasesUrl },
      { label: 'Core Engine', href: '/docs/api/core-functions' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
  },
]

export default function Footer() {
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
            © 2024 WORMA ENGINE.
            <br />
            ALL RIGHTS RESERVED.
          </div>
        </div>
        {links.map(group => (
          <div key={group.title} className="flex flex-col gap-6">
            <span className="font-data-mono text-primary text-[10px] tracking-[0.3em] uppercase">{group.title}</span>
            <div className="flex flex-col gap-3">
              {group.items.map(item => (
                <a key={item.label} className="font-data-mono text-on-surface-variant text-xs transition-colors hover:text-white" href={item.href}>{item.label}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  )
}
