import Image from 'next/image'

export default function FrontendBadge({
  name,
  color,
  icon,
}: {
  name: string
  color: string
  icon?: string
}) {
  return (
    <div className="flex items-center gap-2 border border-gray-200 rounded-lg bg-white px-3 py-2 shadow-sm transition hover:shadow-md">
      {icon
        ? (
            <Image src={icon} alt={name} width={20} height={20} className="h-5 w-5" />
          )
        : (
            <div
              className="h-5 w-5 rounded"
              style={{ backgroundColor: color }}
            />
          )}
      <span className="text-xs text-gray-700 font-semibold tracking-tight">
        {name}
      </span>
    </div>
  )
}
