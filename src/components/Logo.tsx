/** The VEYA symbol on its own (favicon, app icon, compact spaces). */
export function VeyaMark({ className = 'h-7 w-auto' }: { className?: string }) {
  return <img src="/veya-mark.png" alt="" width={450} height={282} className={className} decoding="async" />
}

/** Symbol + wordmark for dark backgrounds. Use `tone="dark"` on light backgrounds. */
export function Wordmark({ className = '', tone = 'light' }: { className?: string; tone?: 'light' | 'dark' }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} role="img" aria-label="VEYA">
      <VeyaMark className="h-8 w-auto drop-shadow-[0_0_12px_rgba(255,255,255,0.45)]" />
      <img
        src={tone === 'light' ? '/veya-wordmark-white.png' : '/veya-wordmark-dark.png'}
        alt="" width={899} height={144} className="h-[1.05rem] w-auto" decoding="async"
      />
    </span>
  )
}
