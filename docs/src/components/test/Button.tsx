import { twMerge } from 'tailwind-merge'
import Icon from './Icon'

export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  className?: string
}

const sizeMap = {
  sm: 'px-6 py-2 text-sm',
  md: 'px-10 py-4',
  lg: 'px-12 py-5',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
}: ButtonProps) {
  const base = 'font-headline-lg font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3'
  const variantClass = variant === 'primary'
    ? 'bg-primary text-black hover:bg-white'
    : 'tech-border text-on-background hover:bg-surface-variant'

  return (
    <button className={twMerge(base, variantClass, sizeMap[size], className)}>
      {children}
      {icon && <Icon name={icon} className="text-sm" />}
    </button>
  )
}
