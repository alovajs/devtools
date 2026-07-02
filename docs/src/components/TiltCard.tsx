'use client'

import { useRef, type ReactNode } from 'react'

/**
 * Wrapper that applies a subtle 3D tilt on hover based on mouse position.
 * Wraps children in a perspective container and rotates toward the cursor.
 */
export default function TiltCard({
  children,
  className = '',
  maxTilt = 3,
  scale = 1.02,
}: {
  children: ReactNode
  className?: string
  maxTilt?: number
  scale?: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current
    if (!card) return

    cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5 // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5 // -0.5 to 0.5

      card.style.transform = `perspective(1000px) rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg) scale3d(${scale}, ${scale}, ${scale})`
    })
  }

  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return

    cancelAnimationFrame(rafRef.current)
    card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
    card.style.transform =
      'perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)'

    // Remove transition after it completes so mousemove is instant again
    setTimeout(() => {
      if (card) card.style.transition = 'transform 0.1s linear'
    }, 600)
  }

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.1s linear' }}
    >
      {children}
    </div>
  )
}
