export default function PluginCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="relative flex flex-col gap-4 border border-gray-300 bg-white p-5 transition hover:border-[#0500ff] hover:bg-[#fafaff]">
      <div className="absolute right-3 top-3 font-mono text-xs text-gray-300 select-none">
        +
      </div>
      {/* Bottom-left corner tick */}
      <span className="absolute -left-px -bottom-px h-2 w-2 border-b border-l border-gray-300" />
      <div className="flex items-center gap-3">
        <div
          className="flex h-[30px] w-[30px] items-center justify-center"
          style={{ backgroundColor: '#eef0ff' }}
        >
          <div className="text-[#0500ff]">{icon}</div>
        </div>
        <span className="font-mono text-sm font-bold uppercase tracking-wider text-gray-900">
          {title}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-gray-500">{desc}</p>
    </div>
  )
}
