export default function IDECard({
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
      {/* Bottom-left corner tick */}
      <span className="absolute -left-px -bottom-px h-2 w-2 border-b border-l border-gray-300" />
      <div className="flex items-start gap-3">
        <div
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center"
          style={{ backgroundColor: '#eef0ff' }}
        >
          <div className="text-[#0500ff]">{icon}</div>
        </div>
        <div className="flex-1">
          <div className="font-mono text-sm font-bold uppercase tracking-wider text-[#0500ff]">
            {title}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
        </div>
      </div>
      {/* Light illustration placeholder */}
      <div className="border border-gray-200 bg-gray-50/80 p-3">
        <div className="space-y-1.5">
          <div className="h-2 w-3/4 bg-gray-200/70" />
          <div className="h-2 w-1/2 bg-gray-200/70" />
          <div className="h-2 w-2/3 bg-gray-200/70" />
        </div>
      </div>
    </div>
  )
}
