import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import Image from 'next/image'
import { gitConfig } from './shared'

function NavTitle() {
  return (
    <div className="relative flex items-center gap-2">
      <span className="text-fd-muted-foreground font-data-mono absolute left-0 hidden text-[10px] -top-3.5 md:block">
        ROOT_NODE
      </span>
      <Image src="/img/logo.svg" alt="worma" width={24} height={24} className="h-6 w-6" />
      <span className="font-headline-lg text-fd-primary text-lg font-bold tracking-tighter uppercase">
        worma
      </span>
    </div>
  )
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <NavTitle />,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  }
}
