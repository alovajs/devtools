export interface ContainerProps {
  children: React.ReactNode
  className?: string
  border?: 'all' | 'x' | 'y' | 'l' | 'r' | 't' | 'b' | 'none'
}

const borderMap = {
  all: 'tech-border',
  x: 'tech-border-x',
  y: 'tech-border-y',
  l: 'tech-border-l',
  r: 'tech-border-r',
  t: 'tech-border-t',
  b: 'tech-border-b',
  none: '',
}

export default function Container({ children, className = '', border = 'none' }: ContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto relative ${borderMap[border]} ${className}`.trim()}>
      {children}
    </div>
  )
}
