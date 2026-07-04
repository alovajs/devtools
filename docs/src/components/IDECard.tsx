export default function IDECard({
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
      className={`group hover:border-brand-blue/30 hover:shadow-brand-blue/5 relative h-full flex flex-col border border-gray-200/80 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-lg ${
        highlighted ? 'gap-5 bg-gradient-to-br from-brand-blue/[0.03] to-transparent' : 'gap-4 bg-white'
      }  ${large ? 'p-8' : ''}`}
    >
      {/* Top accent line */}
      <div className="from-brand-blue to-brand-blue/40 absolute inset-x-4 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r transition-transform duration-300 group-hover:scale-x-100" />
      <div
        className={`text-brand-blue group-hover:bg-brand-blue/5 flex items-center justify-center rounded-xl bg-gray-50 ring-1 ring-gray-100 transition-colors ${
          large ? 'h-14 w-14' : 'h-11 w-11'
        }`}
      >
        {icon}
      </div>
      <div>
        <h3 className={`text-gray-900 font-bold tracking-tight ${large ? 'mb-2 text-xl' : 'mb-1 text-base'}`}>
          {title}
        </h3>
        <p className={`text-gray-500 leading-relaxed ${large ? 'text-base' : 'text-sm'}`}>{desc}</p>
      </div>
    </div>
  )
}
