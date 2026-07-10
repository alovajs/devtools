export interface SectionHeaderProps {
  label: string
  title: string
  className?: string
}

export default function SectionHeader({ label, title, className = '' }: SectionHeaderProps) {
  return (
    <div className={className}>
      <div className="font-data-mono text-[10px] mb-4 uppercase tracking-[0.3em] text-[var(--color-fd-primary)]">{label}</div>
      <h2 className="font-headline-lg text-4xl uppercase font-bold tracking-tighter text-[var(--color-fd-foreground)]">{title}</h2>
    </div>
  )
}
