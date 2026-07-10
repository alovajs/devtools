'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'

/**
 * 以系统（OS）配色作为默认主题。
 *
 * - 每次进入对应布局（即整页加载或跨路由进入该区域）时，将主题重置为 `system`，
 *   从而让默认模式跟随系统，而不是沿用上次手动选择并持久化缓存的值。
 * - 手动切换依然有效：在同一会话内切换后不会立刻被重置，
 *   仅在下一次整页加载 / 重新进入该区域时回到系统默认。
 *
 * `skipHome` 用于根布局：首页强制深色，不应被重置为系统模式。
 */
export function DefaultSystemTheme({ skipHome = false }: { skipHome?: boolean }) {
  const pathname = usePathname()
  const { setTheme } = useTheme()

  useEffect(() => {
    // 首页由 ForceDarkTheme 强制深色，跳过
    if (skipHome && pathname === '/') return
    setTheme('system')
    // 仅在布局挂载（整页加载 / 进入该区域）时执行一次
  }, [])

  return null
}
