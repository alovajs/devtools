export default function FrontendBadge({
  name,
  color,
}: {
  name: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:shadow-md">
      <div
        className="h-5 w-5 rounded"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs font-semibold tracking-tight text-gray-700">
        {name}
      </span>
    </div>
  )
}
