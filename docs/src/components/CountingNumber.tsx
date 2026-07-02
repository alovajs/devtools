'use client'

import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'

/**
 * Animates a number from 0 to the target value when it scrolls into view.
 * Uses motion's animate() for spring-physics-based counting.
 */
export default function CountingNumber({
  value,
  duration = 2,
  className = '',
  prefix = '',
  suffix = '',
}: {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}) {
  const [displayed, setDisplayed] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const animatedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true

          animate(0, value, {
            duration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate(latest) {
              setDisplayed(latest)
            },
          })
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {Math.round(displayed).toLocaleString()}
      {suffix}
    </span>
  )
}
