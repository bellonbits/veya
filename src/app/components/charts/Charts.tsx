import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../../lib/format'

export interface SeriesDef { key: string; label: string; color?: number }
const col = (i: number) => `var(--c-chart-${(i % 5) + 1})`

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}
const niceMax = (v: number) => {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 4 ? 4 : f <= 8 ? 8 : 10) * p
}
const compact = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : `${+n.toFixed(1)}`)

export function Legend({ series }: { series: SeriesDef[] }) {
  if (series.length < 2) return null
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg2">
      {series.map((s, i) => <li key={s.key} className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: col(s.color ?? i) }} />{s.label}</li>)}
    </ul>
  )
}

interface TimeProps {
  data: { label: string; [k: string]: number | string }[]; series: SeriesDef[]; kind?: 'line' | 'area' | 'bar' | 'stack'
  height?: number; format?: (n: number) => string; title: string; className?: string
}
/** Line / area / grouped or stacked bars on one y-axis, with crosshair tooltip and an accessible data table. */
export function TimeChart({ data, series, kind = 'line', height = 220, format = compact, title, className }: TimeProps) {
  const [ref, w] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const H = height, m = { t: 8, r: 8, b: 22, l: 38 }
  const iw = Math.max(10, w - m.l - m.r), ih = H - m.t - m.b
  const n = data.length
  const stacked = kind === 'stack'
  const max = useMemo(() => niceMax(Math.max(0, ...data.map((d) => (stacked ? series.reduce((a, s) => a + Number(d[s.key] || 0), 0) : Math.max(...series.map((s) => Number(d[s.key] || 0)))))) * 1.05), [data, series, stacked])
  const y = (v: number) => m.t + ih - (v / max) * ih
  const bar = kind === 'bar' || stacked
  const x = (i: number) => m.l + (bar ? (i + 0.5) * (iw / n) : n === 1 ? iw / 2 : (i * iw) / (n - 1))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)
  const step = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))))
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), px = e.clientX - r.left - m.l
    setHover(Math.min(n - 1, Math.max(0, Math.round(bar ? px / (iw / n) - 0.5 : (px / iw) * (n - 1)))))
  }
  const bw = Math.max(2, Math.min(28, (iw / n) * (stacked ? 0.62 : 0.72) / (stacked ? 1 : series.length)))
  return (
    <div className={className}>
      <div ref={ref} className="relative w-full" style={{ height: H }}>
        {w > 0 && (
          <svg width={w} height={H} role="img" aria-label={`${title}. ${n} data points; see table below.`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} className="touch-pan-y select-none">
            {ticks.map((t) => (
              <g key={t}><line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} stroke="var(--c-edge)" strokeWidth="1" /><text x={m.l - 6} y={y(t) + 3.5} textAnchor="end" className="fill-fg3 text-[10px]">{format(t)}</text></g>
            ))}
            {data.map((d, i) => (i % step === 0 || i === n - 1 && step < 3 ? <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-fg3 text-[10px]">{d.label}</text> : null))}
            {bar ? data.map((d, i) => {
              let acc = 0
              return series.map((s, si) => {
                const v = Number(d[s.key] || 0)
                if (stacked) { const y0 = y(acc), y1 = y(acc + v); acc += v; return v > 0 ? <rect key={s.key + i} x={x(i) - bw / 2} y={y1} width={bw} height={Math.max(0, y0 - y1 - 2)} rx="3" fill={col(s.color ?? si)} opacity={hover === null || hover === i ? 1 : 0.45} /> : null }
                const gx = x(i) - (bw * series.length) / 2 + si * bw
                return <rect key={s.key + i} x={gx} y={y(v)} width={Math.max(1, bw - 2)} height={Math.max(0, y(0) - y(v))} rx="3" fill={col(s.color ?? si)} opacity={hover === null || hover === i ? 1 : 0.45} />
              })
            }) : series.map((s, si) => {
              const pts = data.map((d, i) => `${x(i)},${y(Number(d[s.key] || 0))}`)
              const c = col(s.color ?? si)
              return (
                <g key={s.key}>
                  {kind === 'area' && <path d={`M${x(0)},${y(0)} L${pts.join(' L')} L${x(n - 1)},${y(0)} Z`} fill={c} opacity="0.12" />}
                  <polyline points={pts.join(' ')} fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  {hover !== null && <circle cx={x(hover)} cy={y(Number(data[hover][s.key] || 0))} r="4" fill={c} stroke="var(--c-panel)" strokeWidth="2" />}
                </g>
              )
            })}
            {hover !== null && !bar && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ih} stroke="var(--c-fg3)" strokeDasharray="3 3" />}
          </svg>
        )}
        {hover !== null && w > 0 && (
          <div className="pointer-events-none absolute z-10 min-w-32 rounded-lg border border-edge bg-panel px-2.5 py-2 text-xs shadow-lg" style={{ left: Math.min(w - 150, Math.max(0, x(hover) - 60)), top: 0 }}>
            <p className="mb-1 font-semibold text-fg">{data[hover].label}</p>
            {series.map((s, i) => <p key={s.key} className="flex items-center justify-between gap-4 text-fg2"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: col(s.color ?? i) }} />{s.label}</span><span className="num font-semibold text-fg">{format(Number(data[hover][s.key] || 0))}</span></p>)}
          </div>
        )}
      </div>
      <Legend series={series} />
      <table className="sr-only"><caption>{title}</caption><thead><tr><th>Period</th>{series.map((s) => <th key={s.key}>{s.label}</th>)}</tr></thead>
        <tbody>{data.map((d, i) => <tr key={i}><th>{d.label}</th>{series.map((s) => <td key={s.key}>{d[s.key]}</td>)}</tr>)}</tbody></table>
    </div>
  )
}

export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1), min = Math.min(...data)
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`).join(' ')
  return <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden><polyline points={pts} fill="none" stroke="var(--c-chart-1)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" /></svg>
}

export interface Slice { label: string; value: number; href?: string }
export function Donut({ data, center, sub, title, format }: { data: Slice[]; center?: string; sub?: string; title: string; format?: (n: number) => string }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1
  const R = 52, C = 2 * Math.PI * R
  let off = 0
  const [hi, setHi] = useState<number | null>(null)
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 130 130" className="-rotate-90" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
          <circle cx="65" cy="65" r={R} fill="none" stroke="var(--c-edge)" strokeWidth="14" />
          {data.map((d, i) => {
            const len = (d.value / total) * C, el = <circle key={d.label} cx="65" cy="65" r={R} fill="none" stroke={col(i)} strokeWidth={hi === i ? 16 : 14} strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={-off} onPointerEnter={() => setHi(i)} onPointerLeave={() => setHi(null)} />
            off += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="num text-xl font-semibold text-fg">{hi !== null ? (format ?? compact)(data[hi].value) : center ?? total}</span>
          <span className="text-[11px] text-fg3">{hi !== null ? data[hi].label : sub ?? 'total'}</span>
        </div>
      </div>
      <ul className="min-w-40 flex-1 space-y-1.5 text-sm">
        {data.map((d, i) => {
          const inner = <><span className="inline-flex items-center gap-2 text-fg2"><span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: col(i) }} />{d.label}</span><span className="num font-semibold text-fg">{(format ?? compact)(d.value)} <span className="font-normal text-fg3">· {Math.round((d.value / total) * 100)}%</span></span></>
          return <li key={d.label}>{d.href ? <Link to={d.href} className="flex justify-between gap-3 rounded px-1 py-0.5 hover:bg-sunk">{inner}</Link> : <div className="flex justify-between gap-3 px-1 py-0.5">{inner}</div>}</li>
        })}
      </ul>
    </div>
  )
}

/** Ranked horizontal bars. Single series → a single colour; direct labels carry the value. */
export function HBars({ data, format = compact, colorIndex = 0, empty = 'No data in this range' }: { data: Slice[]; format?: (n: number) => string; colorIndex?: number; empty?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (!data.length) return <p className="py-6 text-center text-sm text-fg3">{empty}</p>
  return (
    <ul className="space-y-2.5">
      {data.map((d) => {
        const row = (
          <>
            <div className="mb-1 flex justify-between gap-3 text-[13px]"><span className="truncate text-fg2">{d.label}</span><span className="num font-semibold text-fg">{format(d.value)}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-sunk"><div className="h-full rounded-full" style={{ width: `${Math.max(1.5, (d.value / max) * 100)}%`, background: col(colorIndex) }} /></div>
          </>
        )
        return <li key={d.label}>{d.href ? <Link to={d.href} className="block rounded-md p-1 -m-1 hover:bg-sunk/70">{row}</Link> : row}</li>
      })}
    </ul>
  )
}

export function Funnel({ data }: { data: Slice[] }) {
  const top = Math.max(1, data[0]?.value ?? 1)
  return (
    <ol className="space-y-1.5">
      {data.map((d, i) => {
        const prev = i ? data[i - 1].value : d.value
        const row = (
          <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-[13px]">
            <span className="text-fg2">{d.label}</span>
            <div className="h-7 overflow-hidden rounded-md bg-sunk"><div className="flex h-full items-center rounded-md px-2" style={{ width: `${Math.max(4, (d.value / top) * 100)}%`, background: 'var(--c-chart-1)', opacity: 1 - i * 0.1 }} /></div>
            <span className="num w-24 text-right"><b className="font-semibold text-fg">{d.value}</b> <span className="text-fg3">{i ? `· ${prev ? Math.round((d.value / prev) * 100) : 0}%` : ''}</span></span>
          </div>
        )
        return <li key={d.label}>{d.href ? <Link to={d.href} className="block rounded hover:bg-sunk/60">{row}</Link> : row}</li>
      })}
    </ol>
  )
}

export function ChartCard({ title, sub, children, className, action }: { title: string; sub?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cx('rounded-xl border border-edge bg-panel p-4 sm:p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-fg">{title}</h3>{sub && <p className="mt-0.5 text-xs text-fg3">{sub}</p>}</div>{action}</div>
      {children}
    </section>
  )
}
