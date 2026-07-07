export interface SectionHeaderProps {
  label: string
  title: string
  className?: string
}

export default function SectionHeader({ label, title, className = '' }: SectionHeaderProps) {
  return (
    <div className={className}>
      <div className="font-data-mono text-[10px] text-primary mb-4 uppercase tracking-[0.3em]">{label}</div>
      <h2 className="font-headline-lg text-4xl text-on-background uppercase font-bold tracking-tighter">{title}</h2>
    </div>
  )
}
