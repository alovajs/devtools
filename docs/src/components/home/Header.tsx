import Image from 'next/image'
import Link from 'next/link'
import Container from './Container'

export default function Header() {
  return (
    <header className="bg-background/80 backdrop-blur-xl sticky top-0 z-50 tech-border-b">
      <Container border="all" className="flex justify-between items-center w-full px-6 py-4">
        <div className="absolute -top-1 -left-1 text-[10px] text-on-surface-variant font-data-mono">ROOT_NODE</div>
        <div className="font-headline-lg text-2xl text-primary font-bold tracking-tighter uppercase flex items-center gap-2">
          <Image src="/img/logo.svg" alt="worma" width={24} height={24} className="w-6 h-6" />
          worma
        </div>
        <nav className="hidden md:flex items-center gap-12">
          <Link className="font-data-mono text-xs uppercase tracking-widest text-primary" href="#">// Features</Link>
          <Link className="font-data-mono text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">// Plugins</Link>
          <Link className="font-data-mono text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">// Matrix</Link>
          <Link className="font-data-mono text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors" href="#">// Docs</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="bg-primary text-black px-6 py-2 font-headline-lg text-sm font-bold uppercase tracking-wider hover:bg-white transition-all">
            Get Started
          </button>
        </div>
      </Container>
    </header>
  )
}
