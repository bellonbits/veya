import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { animate, svg, type JSAnimation } from 'animejs'
import { workflow } from '../content'
import { prefersReduced } from '../lib/anime'

const meta = ['Sends a message', 'Thread opened', 'Extracts details', 'Lead #1048', 'Record created', 'Follow-up queued', 'Deal closed', 'Metrics updated']
const DURATION = 14000

/** A packet travels the pipeline (anime.js); the active node follows it. Hover pauses, click seeks. */
export default function Workflow() {
  const root = useRef<HTMLElement>(null)
  const packet = useRef<JSAnimation | null>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (prefersReduced()) return
    const line = animate(svg.createDrawable(el.querySelector('.wf-line') as SVGLineElement), { draw: ['0 0', '0 1'], duration: 1800, ease: 'inOutQuad' })
    const p = animate(el.querySelector('.wf-packet') as SVGCircleElement, {
      translateX: [0, 700], duration: DURATION, ease: 'linear', loop: true,
      onUpdate: (self) => setActive(Math.min(workflow.length - 1, Math.floor(self.progress * workflow.length))),
    })
    packet.current = p
    const dots = animate(el.querySelectorAll('.wf-dot'), { scale: [0, 1], delay: (_, i) => 200 + (i ?? 0) * 120, duration: 500, ease: 'outBack' })
    return () => { line.revert(); p.revert(); dots.revert(); packet.current = null }
  }, [])

  const pause = () => packet.current?.pause()
  const play = () => packet.current?.play()
  const jump = (i: number) => {
    setActive(i)
    packet.current?.seek(((i + 0.02) / workflow.length) * DURATION)
  }

  return (
    <section ref={root} className="border-b border-line py-20" aria-label="Business workflow" onMouseEnter={pause} onMouseLeave={play} onFocus={pause} onBlur={play}>
      <div className="mx-auto max-w-[1240px] px-6 sm:px-10">
        <div className="flex items-end justify-between">
          <p className="eyebrow">One workflow, end to end</p>
          <p className="font-mono text-xs text-mist" aria-live="polite">{meta[active]}</p>
        </div>
        <ol className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {workflow.map((n, i) => {
            const on = i === active
            return (
              <li key={n}>
                <motion.button
                  whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                  onClick={() => jump(i)}
                  aria-current={on}
                  animate={{ opacity: on || i < active ? 1 : 0.65 }}
                  className={`relative h-full w-full rounded-xl border p-4 text-left transition-colors duration-500 ${on ? 'border-violet bg-violet/15 shadow-[0_0_0_4px_rgb(109_92_255/0.12)]' : 'border-line bg-ink-2'}`}
                >
                  <span className="flex items-center justify-between font-mono text-[0.65rem] text-mist">
                    0{i + 1}
                    <span className={`h-1.5 w-1.5 rounded-full ${on ? 'bg-lime' : i < active ? 'bg-violet-soft' : 'bg-white/20'}`} />
                  </span>
                  <span className="mt-6 block text-sm font-semibold">{n}</span>
                </motion.button>
              </li>
            )
          })}
        </ol>

        <svg viewBox="0 0 800 20" className="mt-5 hidden h-5 w-full overflow-visible lg:block" aria-hidden>
          <line className="wf-line" x1="50" y1="10" x2="750" y2="10" stroke="#6d5cff" strokeOpacity=".6" strokeWidth="1.5" />
          {workflow.map((_, i) => <circle key={i} className="wf-dot" cx={50 + i * 100} cy="10" r="3.5" fill="#b9b0ff" style={{ transformOrigin: `${50 + i * 100}px 10px` }} />)}
          <circle className="wf-packet" cx="50" cy="10" r="6" fill="#e3f35b" />
        </svg>
      </div>
    </section>
  )
}
