export default function PluginCard({
  icon,
  title,
  desc,
  large = false,
  highlighted = false,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  large?: boolean
  highlighted?: boolean
}) {
  return (
    <div
      className={`group relative flex h-full flex-col rounded-2xl border border-gray-200/80 p-6 shadow-sm transition-all duration-300 hover:border-brand-blue/30 hover:shadow-lg hover:shadow-brand-blue/5 ${
        highlighted ? 'gap-5 bg-gradient-to-br from-brand-blue/[0.03] to-transparent' : 'gap-4 bg-white'
      } ${large ? 'p-8' : ''}`}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-4 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-brand-blue to-brand-blue/40 transition-transform duration-300 group-hover:scale-x-100" />
      <div className="flex items-center gap-3">
        <div
          className={`flex shrink-0 items-center justify-center rounded-lg bg-gray-50 text-brand-blue ring-1 ring-gray-100 transition-colors group-hover:bg-brand-blue/5 ${
            large ? 'h-12 w-12' : 'h-10 w-10'
          }`}
        >
          {icon}
        </div>
        <h3 className={`font-bold font-mono tracking-tight text-gray-900 ${large ? 'text-lg' : 'text-base'}`}>
          {title}
        </h3>
      </div>
      <p className={`leading-relaxed text-gray-500 ${large ? 'mt-1 text-base' : 'mt-1 text-sm'}`}>{desc}</p>
    </div>
  )
}
