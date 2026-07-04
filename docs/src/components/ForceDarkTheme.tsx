'use client'

import { useTheme } from 'next-themes'
import { useEffect, useRef } from 'react'

export function ForceDarkTheme({ children }: { children: React.ReactNode }) {
  const { setTheme, resolvedTheme } = useTheme()
  const prevRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    prevRef.current = resolvedTheme
    setTheme('dark')

    return () => {
      if (prevRef.current) {
        setTheme(prevRef.current)
      }
    }
  }, [])

  return <>{children}</>
}
