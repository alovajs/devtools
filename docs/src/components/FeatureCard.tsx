export default function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="relative flex flex-col gap-5 border border-gray-300 bg-white p-5 transition hover:border-[#0500ff] hover:bg-[#fafaff]">
      {/* Top-right double cross */}
      <div className="absolute right-3 top-3 font-mono text-xs text-gray-300 select-none">
        +
      </div>
      {/* Bottom-left corner tick */}
      <span className="absolute -left-px -bottom-px h-2 w-2 border-b border-l border-gray-300" />
      <div className="text-gray-900">{icon}</div>
      <div className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900">
        {title}
      </div>
      <p className="text-xs leading-relaxed text-gray-500">{desc}</p>
    </div>
  )
}
