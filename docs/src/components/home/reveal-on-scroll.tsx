'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
}

/**
 * Minimal client island: when element enters viewport, renders children normally.
 * Before that, renders with opacity-0 so CSS animations trigger on reveal.
 */
export function RevealOnScroll({ children, className = '', delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => setVisible(true), delay * 1000)
          obs.disconnect()
          return () => clearTimeout(timer)
        }
      },
      { threshold: 0.06 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

/** Reveals children with staggered delays based on index. */
export function RevealStagger({
  items,
  className = '',
  baseDelay = 0.05,
}: {
  items: { key: string; content: React.ReactNode }[]
  className?: string
  baseDelay?: number
}) {
  return (
    <>
      {items.map((item, i) => (
        <RevealOnScroll key={item.key} delay={baseDelay * i} className={className}>
          {item.content}
        </RevealOnScroll>
      ))}
    </>
  )
}
