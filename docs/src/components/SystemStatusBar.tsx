'use client'

import { useEffect, useState } from 'react'

export default function SystemStatusBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="w-full border-b border-gray-200 bg-white px-6 py-1.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-mono text-[10px] tracking-wider text-gray-700">
            // WORMA v2.0.0
          </span>
          <span className="font-mono text-[10px] tracking-wider text-gray-500">
            SYS.TIME {time} UTC+8
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="font-mono text-[10px] flex items-center gap-1.5 tracking-wider text-gray-700">
            <span className="inline-block h-1.5 w-1.5 animate-pulse bg-green-500" />
            STATUS: ONLINE
          </span>
          <span className="font-mono text-[10px] tracking-wider text-gray-500">
            42 MODULES LOADED
          </span>
        </div>
      </div>
    </div>
  )
}
