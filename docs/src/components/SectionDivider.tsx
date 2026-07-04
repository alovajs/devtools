export default function SectionDivider() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="h-px w-full bg-gray-300" />
      <span className="absolute font-mono text-[9px] text-gray-400 select-none">+</span>
    </div>
  )
}
