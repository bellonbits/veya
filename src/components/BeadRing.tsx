// Decorative beaded ring for the case card — pure SVG, no assets.
export default function BeadRing({ className = '' }: { className?: string }) {
  const n = 24
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <defs>
        {Array.from({ length: n }, (_, i) => (
          <radialGradient key={i} id={`bead${i}`} cx=".35" cy=".3" r=".8">
            <stop offset="0" stopColor={`hsl(${335 - i * 4.4} 95% 78%)`} />
            <stop offset=".6" stopColor={`hsl(${335 - i * 4.4} 80% 58%)`} />
            <stop offset="1" stopColor={`hsl(${335 - i * 4.4} 70% 36%)`} />
          </radialGradient>
        ))}
      </defs>
      {Array.from({ length: n }, (_, i) => {
        const t = (i / n) * Math.PI * 2 + 0.6
        const x = 100 + Math.cos(t) * 62
        const y = 100 + Math.sin(t) * 74
        const r = 15 + Math.sin(t * 1.5) * 3.5
        return <circle key={i} cx={x} cy={y} r={r} fill={`url(#bead${i})`} />
      })}
    </svg>
  )
}
