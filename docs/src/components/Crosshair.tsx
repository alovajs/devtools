export default function Crosshair() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#d1d5db" strokeWidth="0.5" />
      <line x1="8" y1="0" x2="8" y2="16" stroke="#d1d5db" strokeWidth="0.5" />
      <line x1="0" y1="8" x2="16" y2="8" stroke="#d1d5db" strokeWidth="0.5" />
      <circle cx="8" cy="8" r="1" fill="#0500ff" />
    </svg>
  )
}
