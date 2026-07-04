export default function CommandBar() {
  return (
    <div className="w-full border-t border-gray-200 bg-white py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 font-mono text-sm text-black">
        <span className="flex items-center gap-1">
          <span className="text-[#0500ff]">{'>'}</span>
          <span className="font-bold">DEPLOYMENT READY</span>
          <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-[#0500ff]" />
        </span>
        <div className="flex items-center gap-8 text-xs tracking-wider text-gray-700">
          <span>CONNECTION SECURE</span>
          <span>ACCESS GRANTED</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 bg-green-500" />
            LIVE
          </span>
        </div>
      </div>
    </div>
  )
}
