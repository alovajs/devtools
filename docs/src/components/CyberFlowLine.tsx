export default function CyberFlowLine() {
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Status label */}
      <span className="font-mono text-[9px] tracking-wider text-gray-400">
        // PARSING
      </span>
      {/* Dashed line with data nodes */}
      <svg width="120" height="30" viewBox="0 0 120 30" fill="none">
        {/* Dashed backbone */}
        <line
          x1="0"
          y1="15"
          x2="120"
          y2="15"
          stroke="#0500ff"
          strokeWidth="1"
          strokeDasharray="3 5"
          opacity="0.4"
        />
        {/* Data nodes */}
        <rect x="18" y="11.5" width="3" height="7" fill="#0500ff" opacity="0.5" />
        <rect x="40" y="11.5" width="3" height="7" fill="#0500ff" opacity="0.7" />
        <circle cx="62" cy="15" r="2" fill="#0500ff" opacity="0.85" />
        <rect x="80" y="11.5" width="3" height="7" fill="#0500ff" opacity="0.6" />
        <rect x="98" y="11.5" width="3" height="7" fill="#0500ff" opacity="0.35" />
      </svg>
      {/* Progress label */}
      <span className="font-mono text-[9px] tracking-wider text-gray-400">
        RENDERING 83%
      </span>
    </div>
  )
}
