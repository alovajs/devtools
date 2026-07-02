'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'motion'

/**
 * Creates a large radial gradient spotlight that follows the mouse cursor,
 * giving the page a premium, interactive lighting feel.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return

    let raf: number
    let mouseX = -500
    let mouseY = -500
    let currentX = -500
    let currentY = -500

    const handleMouse = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const updateGlow = () => {
      // Smooth follow with lerp
      currentX += (mouseX - currentX) * 0.08
      currentY += (mouseY - currentY) * 0.08

      glow.style.background = `radial-gradient(600px circle at ${currentX}px ${currentY}px, rgba(5,0,255,0.06), rgba(5,0,255,0.02) 40%, transparent 70%)`

      raf = requestAnimationFrame(updateGlow)
    }

    window.addEventListener('mousemove', handleMouse, { passive: true })
    raf = requestAnimationFrame(updateGlow)

    return () => {
      window.removeEventListener('mousemove', handleMouse)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: 'radial-gradient(600px circle at -500px -500px, rgba(5,0,255,0.06), transparent 70%)',
      }}
    />
  )
}
