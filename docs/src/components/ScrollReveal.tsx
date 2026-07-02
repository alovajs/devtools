'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register plugin once
gsap.registerPlugin(ScrollTrigger, useGSAP)

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  direction?: RevealDirection
  duration?: number
  delay?: number
  distance?: number
  stagger?: number
  once?: boolean
  as?: keyof JSX.IntrinsicElements
}

/**
 * Wraps children and reveals them with a GSAP ScrollTrigger animation.
 * Uses @gsap/react's useGSAP for proper cleanup in React 19.
 */
export default function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  duration = 0.8,
  delay = 0,
  distance = 40,
  stagger = 0,
  once = true,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const getFromVars = () => {
    switch (direction) {
      case 'up':
        return { y: distance, opacity: 0 }
      case 'down':
        return { y: -distance, opacity: 0 }
      case 'left':
        return { x: distance, opacity: 0 }
      case 'right':
        return { x: -distance, opacity: 0 }
      case 'none':
        return { opacity: 0 }
    }
  }

  useGSAP(
    () => {
      gsap.fromTo(
        containerRef.current,
        { ...getFromVars() },
        {
          y: 0,
          x: 0,
          opacity: 1,
          duration,
          delay,
          ease: 'power3.out',
          stagger,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            toggleActions: once ? 'play none none none' : 'play none none reset',
          },
        }
      )
    },
    { scope: containerRef, dependencies: [direction, duration, delay, distance, stagger, once] }
  )

  return (
    <Tag ref={containerRef as any} className={className}>
      {children}
    </Tag>
  )
}
