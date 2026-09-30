import type { DateRange } from '../types'
import { DAY, shortDate } from './format'

const startOfDay = (t: number) => new Date(t).setHours(0, 0, 0, 0)

export function makeRange(preset: DateRange['preset'], custom?: { from: string; to: string }, now = Date.now()): DateRange {
  const today = startOfDay(now)
  if (preset === 'custom' && custom?.from && custom?.to) {
    const from = startOfDay(new Date(custom.from).getTime()), to = startOfDay(new Date(custom.to).getTime()) + DAY
    return { from, to: Math.min(to, now + 1), preset, label: `${shortDate(from)} – ${shortDate(to - 1)}` }
  }
  const days = preset === 'today' ? 1 : preset === '7d' ? 7 : preset === '90d' ? 90 : 30
  const p = preset === 'custom' ? '30d' : preset
  return { from: today - (days - 1) * DAY, to: now + 1, preset: p, label: p === 'today' ? 'Today' : `Last ${days} days` }
}
export const rangeDays = (r: DateRange) => Math.max(1, Math.round((r.to - r.from) / DAY))
export const rangeQuery = (r: DateRange) => `from=${new Date(r.from).toISOString().slice(0, 10)}&to=${new Date(r.to - 1).toISOString().slice(0, 10)}`
