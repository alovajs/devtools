import Link from 'next/link'
import { twMerge } from 'tailwind-merge'
import Icon from './Icon'

export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  className?: string
  target?: string
  href?: string
}

const sizeMap = {
  sm: 'px-4 py-1.5 text-xs lg:px-6 lg:py-2 lg:text-sm',
  md: 'px-6 py-2.5 text-sm lg:px-10 lg:py-4 lg:text-base',
  lg: 'px-8 py-3 text-base lg:px-12 lg:py-5 lg:text-lg',
}

const isExternal = (url: string) => /^https?:\/\//.test(url)

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  target,
  href,
}: ButtonProps) {
  const base = 'font-headline-lg font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 cursor-pointer'
  const variantClass = variant === 'primary'
    ? 'bg-primary text-black hover:bg-white hover:text-primary'
    : 'tech-border text-on-background hover:bg-surface-variant'

  const mergedClass = twMerge(base, variantClass, sizeMap[size], className)
  const content = (
    <>
      {children}
      {icon && <Icon name={icon} className="text-sm" />}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={mergedClass}
        target={target ?? (isExternal(href) ? '_blank' : undefined)}
        rel={isExternal(href) ? 'noreferrer' : undefined}
      >
        {content}
      </Link>
    )
  }

  return (
    <button className={mergedClass}>
      {content}
    </button>
  )
}
