const themeBlue = '#0500ff'

export default function SectionNum({ num }: { num: string }) {
  return (
    <span
      className="font-mono text-[12px] font-medium tracking-tight"
      style={{ color: themeBlue }}
    >
      /
      {num}
      {' '}
      +
    </span>
  )
}
