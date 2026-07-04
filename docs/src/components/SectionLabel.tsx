export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono text-[10px] font-medium tracking-[0.25em] text-gray-500 uppercase"
      style={{ writingMode: 'vertical-rl' }}
    >
      {children}
    </span>
  )
}
