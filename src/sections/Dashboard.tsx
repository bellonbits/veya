import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { animate, stagger, svg } from 'animejs'
import type { LeadStatus } from '../lib/types'
import { useAnime } from '../lib/anime'

const nav = ['Overview', 'Inbox', 'Leads', 'Customers', 'Automations', 'AI Agents', 'Analytics', 'Integrations', 'Settings']

const metrics = [
  ['New leads', '48', '+12%', [3, 5, 4, 7, 6, 9, 8, 11]],
  ['Qualified leads', '21', '+8%', [2, 3, 3, 4, 5, 4, 6, 7]],
  ['Response rate', '96%', '+3%', [8, 8, 9, 9, 9, 10, 10, 10]],
  ['Conversion rate', '14%', '+1.2%', [5, 6, 5, 7, 6, 7, 8, 8]],
  ['Active automations', '12', '2 new', [6, 6, 7, 8, 8, 9, 11, 12]],
] as const

const pipeline: [LeadStatus, number, string[]][] = [
  ['new', 14, ['Amina W. · Kilimani 2BR', 'J. Otieno · Warehouse enquiry']],
  ['contacted', 9, ['S. Mwangi · Fleet quote']],
  ['qualified', 7, ['R. Kamau · Viewing Sat']],
  ['won', 3, ['Lakeview Ltd · Onboarding']],
]

const convos = [
  ['Amina W.', 'WhatsApp', 'Looking for a 2 bedroom in Kilimani', 'Agent'],
  ['J. Otieno', 'Website', 'Do you deliver to Mombasa?', 'Agent'],
  ['S. Mwangi', 'Email', 'Requesting a quote for 12 vehicles', 'Human'],
  ['R. Kamau', 'WhatsApp', 'Can I move the viewing to 4pm?', 'Agent'],
]
const activity = ['Follow-up sent to Lead #1046', 'Lead #1048 assigned to Grace', 'Reminder: viewing Sat 10:00', 'Weekly summary generated']
const agents = [['Lead qualifier', 'Active', '38 chats'], ['FAQ responder', 'Active', '112 chats'], ['After-hours cover', 'Scheduled', '—']]
const customers = [['Lakeview Ltd', 'Real estate'], ['Kilo Freight', 'Logistics'], ['Bright Prep', 'Education']]

function Spark({ d }: { d: readonly number[] }) {
  const max = Math.max(...d)
  const pts = d.map((v, i) => `${(i / (d.length - 1)) * 80},${24 - (v / max) * 22}`).join(' ')
  return (
    <svg viewBox="0 0 80 26" className="h-6 w-20" aria-hidden>
      <polyline className="spark" points={pts} fill="none" stroke="#6d5cff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const Card = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-line bg-ink-2 p-4 ${className}`}>
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-mist">{title}</h3>
    {children}
  </section>
)

export default function Dashboard() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })

  useAnime(ref, (reduced) => {
    if (!inView || reduced) return
    animate(svg.createDrawable('.spark'), { draw: ['0 0', '0 1'], delay: stagger(120), duration: 1400, ease: 'inOutQuad' })
    animate('.pipe-card', { opacity: [0, 1], translateY: [12, 0], delay: stagger(90, { start: 300 }), duration: 600, ease: 'outQuad' })
    ref.current?.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count)
      const suffix = el.dataset.suffix ?? ''
      const o = { v: 0 }
      animate(o, {
        v: target, duration: 1600, ease: 'outExpo',
        onUpdate: () => { el.textContent = `${Math.round(o.v)}${suffix}` },
      })
    })
  }, [inView])

  return (
    <div ref={ref} className="flex min-h-full bg-ink text-sm text-white">
      <aside className="hidden w-52 shrink-0 border-r border-line p-4 md:block" aria-label="Sidebar">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-violet text-[0.65rem] font-bold">K</span>
          <span className="font-semibold">Kilimani Homes</span>
        </div>
        <ul className="space-y-0.5">
          {nav.map((n, i) => (
            <li key={n}>
              <a href="#" onClick={(e) => e.preventDefault()} aria-current={i === 0 ? 'page' : undefined}
                className={`block rounded-lg px-3 py-2 ${i === 0 ? 'bg-white/8 text-white' : 'text-mist hover:text-white'}`}>{n}</a>
            </li>
          ))}
        </ul>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
            <p className="text-xs text-mist">Last 7 days · Sample data</p>
          </div>
          <span className="rounded-lg border border-line px-3 py-1.5 text-xs text-mist">Nairobi · EAT</span>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {metrics.map(([l, v, d, s]) => (
            <div key={l} className="rounded-xl border border-line bg-ink-2 p-4">
              <p className="text-xs text-mist">{l}</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-semibold tracking-tight" data-count={parseFloat(v)} data-suffix={v.replace(/[0-9.]/g, '')}>{v}</p>
                <Spark d={s} />
              </div>
              <p className="mt-1 text-xs text-lime">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <Card title="Lead pipeline" className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {pipeline.map(([s, n, items]) => (
                <div key={s} className="rounded-lg bg-ink p-3">
                  <p className="flex justify-between text-xs capitalize text-mist">{s}<span className="text-white">{n}</span></p>
                  <ul className="mt-3 space-y-2">
                    {items.map((i) => <li key={i} className="pipe-card rounded-md border border-line bg-ink-2 p-2 text-xs">{i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Recent conversations">
            <ul className="space-y-3">
              {convos.map(([n, c, p, h]) => (
                <li key={n} className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{n} <span className="text-xs font-normal text-mist">· {c}</span></p>
                    <p className="truncate text-xs text-mist">{p}</p>
                  </div>
                  <span className={`h-fit rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${h === 'Agent' ? 'bg-violet/20 text-violet-soft' : 'bg-lime/15 text-lime'}`}>{h}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Automation activity">
            <ul className="space-y-2.5 text-xs">
              {activity.map((a) => <li key={a} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />{a}</li>)}
            </ul>
          </Card>
          <Card title="AI agent activity">
            <ul className="space-y-2.5 text-xs">
              {agents.map(([n, s, c]) => <li key={n} className="flex justify-between"><span>{n}</span><span className="text-mist">{s} · {c}</span></li>)}
            </ul>
          </Card>
          <Card title="Recent customers">
            <ul className="space-y-2.5 text-xs">
              {customers.map(([n, i]) => <li key={n} className="flex justify-between"><span>{n}</span><span className="text-mist">{i}</span></li>)}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  )
}
