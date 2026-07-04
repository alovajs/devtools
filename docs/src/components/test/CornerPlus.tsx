export interface CornerPlusProps {
  className?: string
}

export default function CornerPlus({ className = '' }: CornerPlusProps) {
  return <div className={`corner-plus ${className}`.trim()} />
}
