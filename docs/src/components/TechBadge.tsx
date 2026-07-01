export default function TechBadge({
  name,
  color,
}: {
  name: string
  color: string
}) {
  return (
    <div className="flex items-center gap-2 border-2 border-gray-300 bg-white px-3 py-2">
      <div
        className="h-5 w-5"
        style={{ backgroundColor: color }}
      />
      <span className="font-mono text-xs font-medium tracking-wider text-gray-700">
        {name}
      </span>
    </div>
  )
}
