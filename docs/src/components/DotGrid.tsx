export default function DotGrid() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 select-none"
      style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 0.5px, transparent 0.5px)',
        backgroundSize: '24px 24px',
        opacity: 0.3,
      }}
    />
  )
}
