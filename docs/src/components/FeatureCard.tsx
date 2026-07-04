export default function FeatureCard({
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
      <div
        className={`flex items-center justify-center rounded-xl bg-gray-50 text-brand-blue ring-1 ring-gray-100 transition-colors group-hover:bg-brand-blue/5 ${
          large ? 'h-14 w-14' : 'h-12 w-12'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h3 className={`font-bold tracking-tight text-gray-900 ${large ? 'text-xl' : 'text-lg'}`}>
          {title}
        </h3>
        <p className={`leading-relaxed text-gray-500 ${large ? 'mt-2 text-base' : 'mt-1 text-sm'}`}>{desc}</p>
      </div>
    </div>
  )
}
