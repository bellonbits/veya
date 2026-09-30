import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { LeadStatus } from '../../types'
import { cap, cx, initials } from '../../lib/format'
import { Sparkline } from '../charts/Charts'

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'bad'
const T: Record<Tone, string> = {
  neutral: 'bg-sunk text-fg2', accent: 'bg-accent-soft text-accent-ink', ok: 'bg-ok-soft text-ok', warn: 'bg-warn-soft text-warn', bad: 'bg-bad-soft text-bad',
}
export function Badge({ tone = 'neutral', children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold', T[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}{children}
    </span>
  )
}
export const LEAD_TONE: Record<LeadStatus, Tone> = { new: 'accent', qualified: 'accent', contacted: 'neutral', proposal: 'warn', negotiation: 'warn', won: 'ok', lost: 'bad' }
export const LeadBadge = ({ status }: { status: LeadStatus }) => <Badge tone={LEAD_TONE[status]} dot>{cap(status)}</Badge>
const STATUS_TONE: Record<string, Tone> = { active: 'ok', ready: 'ok', completed: 'ok', open: 'ok', connected: 'ok', paused: 'warn', waiting: 'warn', processing: 'warn', snoozed: 'warn', running: 'accent', draft: 'neutral', closed: 'neutral', inactive: 'neutral', new: 'accent', failed: 'bad', done: 'ok', available: 'neutral', 'coming soon': 'neutral' }
export const StatusBadge = ({ status }: { status: string }) => <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot>{cap(status)}</Badge>

const hueOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7)
export function Avatar({ name, size = 32, hue, ai, className }: { name: string; size?: number; hue?: number; ai?: boolean; className?: string }) {
  const h = hue ?? hueOf(name)
  return (
    <span aria-hidden className={cx('inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold', className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: ai ? 'var(--c-accent)' : `hsl(${h} 45% 50% / 0.16)`, color: ai ? '#fff' : `hsl(${h} 50% 42%)` }}>
      {ai ? 'V' : initials(name)}
    </span>
  )
}

export function Card({ children, className, pad = true, as: As = 'section' }: { children: ReactNode; className?: string; pad?: boolean; as?: 'section' | 'div' | 'article' }) {
  return <As className={cx('rounded-xl border border-edge bg-panel', pad && 'p-4 sm:p-5', className)}>{children}</As>
}
export function SectionHeader({ title, sub, action, id }: { title: string; sub?: string; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div><h2 id={id} className="text-sm font-semibold tracking-tight text-fg">{title}</h2>{sub && <p className="mt-0.5 text-xs text-fg3">{sub}</p>}</div>
      {action}
    </div>
  )
}
export function PageHeader({ title, sub, actions, tabs, back }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; tabs?: ReactNode; back?: ReactNode }) {
  return (
    <header className="mb-5">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0"><h1 className="text-2xl font-semibold tracking-[-0.03em] text-fg sm:text-[1.7rem]">{title}</h1>{sub && <p className="mt-1 text-sm text-fg2">{sub}</p>}</div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-4">{tabs}</div>}
    </header>
  )
}

export interface TabDef { id: string; label: string; count?: number; to?: string }
export function Tabs({ tabs, active, onChange, label = 'Sections' }: { tabs: TabDef[]; active: string; onChange?: (id: string) => void; label?: string }) {
  return (
    <div role="tablist" aria-label={label} className="scroll-thin -mx-1 flex gap-1 overflow-x-auto border-b border-edge px-1">
      {tabs.map((t) => {
        const on = t.id === active
        const cls = cx('-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition', on ? 'border-accent text-fg' : 'border-transparent text-fg3 hover:text-fg')
        const inner = <>{t.label}{t.count !== undefined && <span className="num rounded bg-sunk px-1.5 py-px text-[11px] font-semibold text-fg2">{t.count}</span>}</>
        return t.to
          ? <Link key={t.id} role="tab" aria-selected={on} to={t.to} className={cls}>{inner}</Link>
          : <button key={t.id} role="tab" aria-selected={on} type="button" onClick={() => onChange?.(t.id)} className={cls}>{inner}</button>
      })}
    </div>
  )
}
export function Segmented<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-lg bg-sunk p-0.5">
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}
          className={cx('inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-semibold transition', o.id === value ? 'bg-panel text-fg shadow-sm' : 'text-fg3 hover:text-fg')}>
          {o.label}{o.count !== undefined && <span className="num text-[11px] text-fg3">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Delta({ value, invert, unit = '%' }: { value: number | null; invert?: boolean; unit?: string }) {
  if (value === null) return <span className="text-xs text-fg3">new</span>
  const up = value > 0.05, down = value < -0.05
  const good = invert ? down : up
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus
  return (
    <span className={cx('num inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-semibold', !up && !down ? 'text-fg3' : good ? 'text-ok' : 'text-bad')}>
      <Icon className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">{up ? 'up' : down ? 'down' : 'no change'} </span>{value > 0 ? '+' : ''}{value.toFixed(1)}{unit}
    </span>
  )
}
export function MetricCard({ label, value, delta, hint, href, invert, spark, unit }: { label: string; value: string; delta?: number | null; hint?: string; href?: string; invert?: boolean; spark?: number[]; unit?: string }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-fg3">{label}</p>
        {delta !== undefined && <Delta value={delta} invert={invert} unit={unit} />}
      </div>
      <p className="num mt-2 text-[1.9rem] font-semibold leading-none tracking-[-0.04em] text-fg">{value}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        {hint && <p className="text-xs leading-snug text-fg3">{hint}</p>}
        {spark && <Sparkline data={spark} className="h-6 w-16 shrink-0" />}
      </div>
    </>
  )
  const cls = 'block rounded-xl border border-edge bg-panel p-4 transition'
  return href ? <Link to={href} className={cx(cls, 'hover:border-accent/60 hover:shadow-sm')} aria-label={`${label}: ${value}. Open underlying records`}>{body}</Link> : <div className={cls}>{body}</div>
}

export function Skeleton({ className }: { className?: string }) { return <div aria-hidden className={cx('skeleton rounded-md', className)} /> }

export function Timeline({ children }: { children: ReactNode }) { return <ol className="relative space-y-0">{children}</ol> }
export function TimelineItem({ icon, children, time, last }: { icon: ReactNode; children: ReactNode; time: string; last?: boolean }) {
  return (
    <li className="relative flex gap-3 pb-4">
      {!last && <span aria-hidden className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px bg-edge" />}
      <span className="z-10 mt-0.5 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border border-edge bg-panel text-fg2">{icon}</span>
      <div className="min-w-0 flex-1 pt-0.5"><div className="text-sm leading-snug text-fg">{children}</div><p className="mt-0.5 text-xs text-fg3">{time}</p></div>
    </li>
  )
}
export const Kbd = ({ children }: { children: ReactNode }) => <kbd className="rounded border border-edge2 bg-sunk px-1.5 py-px font-sans text-[11px] font-semibold text-fg3">{children}</kbd>
export function DefList({ items }: { items: [string, ReactNode][] }) {
  return <dl className="divide-y divide-edge text-sm">{items.map(([k, v]) => <div key={k} className="grid grid-cols-[7rem_1fr] gap-3 py-2"><dt className="text-fg3">{k}</dt><dd className="min-w-0 break-words text-fg">{v || <span className="text-fg3">—</span>}</dd></div>)}</dl>
}
