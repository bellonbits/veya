export const DAY = 86_400_000
export const HOUR = 3_600_000
export const MIN = 60_000

export const kes = (n: number, compact = true) =>
  compact && n >= 1_000_000 ? `KES ${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  : compact && n >= 10_000 ? `KES ${Math.round(n / 1000)}K`
  : `KES ${n.toLocaleString('en-KE')}`

export const num = (n: number) => n.toLocaleString('en-KE')
export const pct = (n: number, digits = 1) => `${n.toFixed(digits)}%`

export function ago(ts: number, now = Date.now()) {
  const d = now - ts
  if (d < 45_000) return 'just now'
  if (d < HOUR) return `${Math.max(1, Math.round(d / MIN))}m ago`
  if (d < DAY) return `${Math.round(d / HOUR)}h ago`
  if (d < 7 * DAY) return `${Math.round(d / DAY)}d ago`
  return new Date(ts).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}
export const shortTime = (ts: number) => new Date(ts).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false })
export const shortDate = (ts: number) => new Date(ts).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
export const dateTime = (ts: number) => `${shortDate(ts)}, ${shortTime(ts)}`
export const isoDay = (ts: number) => new Date(ts).toISOString().slice(0, 10)

export function dueLabel(ts: number, now = Date.now()) {
  const startToday = new Date(now).setHours(0, 0, 0, 0)
  if (ts < startToday) return `Overdue · ${shortDate(ts)}`
  if (ts < startToday + DAY) return `Today · ${shortTime(ts)}`
  if (ts < startToday + 2 * DAY) return `Tomorrow · ${shortTime(ts)}`
  return `${shortDate(ts)} · ${shortTime(ts)}`
}

export function duration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < HOUR) return `${Math.round(ms / MIN)}m`
  return `${(ms / HOUR).toFixed(1)}h`
}
const trim = (n: number) => String(+n.toFixed(1))
export const secLabel = (s: number) => (s < 60 ? `${Math.round(s)}s` : s < 3600 ? `${trim(s / 60)}m` : `${trim(s / 3600)}h`)

export const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const channelName = (c: string) => ({ whatsapp: 'WhatsApp', website: 'Website', email: 'Email', sms: 'SMS' } as Record<string, string>)[c] ?? cap(c)
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function greeting(now = new Date()) {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
