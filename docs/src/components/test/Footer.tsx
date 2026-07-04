import SectionLabel from './SectionLabel'

const links = [
  {
    title: 'Resources',
    items: ['Documentation', 'GitHub Repository', 'Examples'],
  },
  {
    title: 'Project',
    items: ['Changelog', 'Releases', 'Core Engine'],
  },
  {
    title: 'Legal',
    items: ['Terms of Service', 'Privacy Policy'],
  },
]

export default function Footer() {
  return (
    <footer className="bg-background border-t tech-border mt-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-6 py-16 tech-border-x max-w-7xl mx-auto relative">
        <SectionLabel>END_OF_TRANSMISSION</SectionLabel>
        <div className="flex flex-col">
          <div className="font-headline-lg text-3xl text-primary font-bold uppercase tracking-tighter mb-6">worma</div>
          <div className="font-data-mono text-[10px] text-on-surface-variant tracking-[0.2em]">
            © 2024 WORMA ENGINE.<br />ALL RIGHTS RESERVED.
          </div>
        </div>
        {links.map(group => (
          <div key={group.title} className="flex flex-col gap-6">
            <span className="font-data-mono text-[10px] text-primary uppercase tracking-[0.3em]">{group.title}</span>
            <div className="flex flex-col gap-3">
              {group.items.map(item => (
                <a key={item} className="font-data-mono text-xs text-on-surface-variant hover:text-white transition-colors" href="#">{item}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  )
}
