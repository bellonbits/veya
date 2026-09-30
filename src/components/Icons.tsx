export const Sparkle = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M12 2c.6 5.4 2.6 8.4 8 10-5.4 1.6-7.4 4.6-8 10-.6-5.4-2.6-8.4-8-10 5.4-1.6 7.4-4.6 8-10z" />
    <path d="M19.5 1c.2 1.6.9 2.3 2.5 2.7-1.6.4-2.3 1.1-2.5 2.7-.2-1.6-.9-2.3-2.5-2.7 1.6-.4 2.3-1.1 2.5-2.7z" />
  </svg>
)
export const Arrow = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
export const Grid = ({ className = 'h-3 w-3' }: { className?: string }) => (
  <svg viewBox="0 0 12 12" className={className} fill="currentColor" aria-hidden>
    <rect width="5" height="5" rx="1.4" /><rect x="7" width="5" height="5" rx="1.4" /><rect y="7" width="5" height="5" rx="1.4" /><rect x="7" y="7" width="5" height="5" rx="1.4" />
  </svg>
)
