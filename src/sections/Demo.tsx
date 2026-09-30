import { useCallback, useEffect, useRef, useState } from 'react'
import { Reveal } from '../lib/reveal'

const MSG = "Hi, I'm looking for a 2 bedroom apartment in Kilimani."
const REPLY = 'Hello! Happy to help. What is your budget per month, and when are you looking to move?'
const FIELDS = [
  ['Name', 'Amina W.'],
  ['Location', 'Kilimani, Nairobi'],
  ['Property type', '2 bedroom apartment'],
  ['Budget', 'KES 90,000 / month'],
  ['Intent', 'Rent — within 30 days'],
] as const

export default function Demo() {
  const [step, setStep] = useState(0) // 0 idle, 1 msg, 2 reply, 3..7 fields, 8 lead, 9 crm
  const timers = useRef<number[]>([])
  const clear = () => timers.current.forEach(clearTimeout)

  const run = useCallback(() => {
    clear()
    setStep(1)
    const seq = [900, 1900, 2700, 3300, 3900, 4500, 5100, 5900, 6800]
    timers.current = seq.map((t, i) => window.setTimeout(() => setStep(i + 2), t))
  }, [])
  useEffect(() => () => clear(), [])

  const fieldsShown = Math.max(0, Math.min(5, step - 2))
  return (
    <section id="demo" className="border-b border-line py-24 sm:py-32" aria-labelledby="demo-h">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Demo</p>
            <h2 id="demo-h" className="h2 mt-4 max-w-2xl text-4xl sm:text-6xl">From first message to qualified lead.</h2>
          </div>
          <button onClick={run} className="rounded-xl bg-lime px-6 py-3.5 text-xs font-bold uppercase tracking-wide text-ink transition hover:bg-white">
            {step === 0 ? 'Run the demo' : 'Replay'}
          </button>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-3" aria-live="polite">
          {/* Conversation */}
          <div className="flex min-h-[26rem] flex-col rounded-2xl border border-line bg-ink-2 p-5">
            <p className="eyebrow">WhatsApp · Conversation</p>
            <div className="mt-5 flex flex-1 flex-col gap-3 text-sm">
              {step >= 1 && <p className="rise max-w-[85%] self-end rounded-2xl rounded-br-sm bg-violet px-4 py-3">{MSG}</p>}
              {step >= 2 && (
                <div className="rise max-w-[85%] self-start rounded-2xl rounded-bl-sm bg-ink-3 px-4 py-3">
                  <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-widest text-lime">VEYA Agent</p>
                  {REPLY}
                </div>
              )}
              {step === 0 && <p className="m-auto text-mist">Press “Run the demo” to start.</p>}
            </div>
          </div>

          {/* Extraction */}
          <div className="rounded-2xl border border-line bg-ink-2 p-5">
            <p className="eyebrow">Agent · Extracted</p>
            <dl className="mt-5 space-y-2">
              {FIELDS.map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between rounded-lg border border-line bg-ink px-4 py-3 text-sm">
                  <dt className="text-mist">{k}</dt>
                  <dd className={`font-medium transition duration-500 ${i < fieldsShown ? 'opacity-100' : 'opacity-0'}`}>{v}</dd>
                </div>
              ))}
            </dl>
            <div className={`mt-4 rounded-xl border border-lime/40 bg-lime/10 p-4 transition duration-500 ${step >= 8 ? 'opacity-100' : 'opacity-0'}`}>
              <p className="font-mono text-xs text-lime">LEAD #1048</p>
              <p className="mt-1 text-sm">Status: <span className="font-semibold">Qualified</span></p>
              <p className="text-sm text-white/80">Next action: Schedule viewing</p>
            </div>
          </div>

          {/* CRM */}
          <div className="rounded-2xl border border-line bg-ink-2 p-5">
            <p className="eyebrow">VEYA CRM · Leads</p>
            <ul className="mt-5 space-y-2 text-sm">
              {[['#1047', 'J. Otieno', 'New'], ['#1046', 'S. Mwangi', 'Contacted']].map(([id, n, s]) => (
                <li key={id} className="flex items-center justify-between rounded-lg border border-line px-4 py-3 text-mist">
                  <span className="font-mono text-xs">{id}</span><span>{n}</span><span className="text-xs">{s}</span>
                </li>
              ))}
              {step >= 9 && (
                <li className="rise flex items-center justify-between rounded-lg border border-violet bg-violet/15 px-4 py-3">
                  <span className="font-mono text-xs">#1048</span><span>Amina W.</span>
                  <span className="rounded-full bg-lime px-2.5 py-0.5 text-xs font-semibold text-ink">Qualified</span>
                </li>
              )}
            </ul>
            <p className="mt-6 text-xs text-mist">Simulated example. Names and figures are illustrative.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
