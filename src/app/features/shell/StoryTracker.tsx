import { Link } from 'react-router-dom'
import { Check, Loader2, X } from 'lucide-react'
import { useStory } from '../../store/story'
import { cx } from '../../lib/format'

/** Shows the connected chain: conversation → customer → lead → workflow → task → analytics. */
export function StoryTracker() {
  const { steps, running, dismissed, dismiss, customerName } = useStory()
  if (!steps.length || dismissed) return null
  const current = steps.findIndex((s) => !s.done)
  return (
    <aside aria-label="Live demo: one customer inquiry across VEYA" className="fixed bottom-20 right-3 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-edge bg-panel p-4 shadow-2xl md:bottom-5 md:right-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div><p className="text-sm font-semibold text-fg">{running ? 'Simulating an inquiry…' : 'Inquiry processed'}</p><p className="text-xs text-fg3">{customerName} · one message, five modules</p></div>
        <button type="button" aria-label="Dismiss" onClick={dismiss} className="text-fg3 hover:text-fg"><X className="h-4 w-4" /></button>
      </div>
      <ol className="space-y-2.5">
        {steps.map((s, i) => (
          <li key={s.id} className="flex gap-2.5">
            <span className={cx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full', s.done ? 'bg-ok text-white' : i === current && running ? 'text-accent-ink' : 'bg-sunk')}>
              {s.done ? <Check className="h-3 w-3" aria-hidden /> : i === current && running ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
            </span>
            <div className="min-w-0 text-[13px] leading-snug">
              <p className={cx('font-semibold', s.done ? 'text-fg' : 'text-fg3')}>{s.done && s.href ? <Link to={s.href} className="hover:text-accent-ink hover:underline">{s.label} →</Link> : s.label}</p>
              {(s.done || i === current) && <p className="text-fg3">{s.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </aside>
  )
}
