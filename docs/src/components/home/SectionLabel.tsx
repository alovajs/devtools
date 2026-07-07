export interface SectionLabelProps {
  children: React.ReactNode
  className?: string
}

export default function SectionLabel({ children, className = '' }: SectionLabelProps) {
  return (
    <div className={`absolute top-0 left-0 p-4 font-data-mono text-[9px] text-outline ${className}`.trim()}>
      {children}
    </div>
  )
}
