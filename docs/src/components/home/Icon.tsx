import type { CSSProperties } from 'react'

export interface IconProps {
  name: string
  className?: string
  style?: CSSProperties
}

export default function Icon({ name, className = '', style }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${className}`.trim()} style={style}>
      {name}
    </span>
  )
}
