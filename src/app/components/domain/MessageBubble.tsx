import { Paperclip, Sparkles } from 'lucide-react'
import type { Message } from '../../types'
import { getUserName } from '../../store/db'
import { cx, shortTime } from '../../lib/format'

/** Customer left; AI and human agents right, each with a distinct treatment and a text label (never colour alone). */
export function MessageBubble({ m, customerName, agentName }: { m: Message; customerName: string; agentName: string }) {
  const mine = m.author !== 'customer'
  const who = m.author === 'customer' ? customerName : m.author === 'ai' ? agentName : getUserName(m.userId)
  return (
    <li className={cx('flex flex-col', mine ? 'items-end' : 'items-start')}>
      <p className="mb-1 flex items-center gap-1.5 px-1 text-[11px] text-fg3">
        {m.author === 'ai' && <span className="inline-flex items-center gap-1 rounded bg-accent-soft px-1.5 py-px font-semibold text-accent-ink"><Sparkles className="h-2.5 w-2.5" aria-hidden />VEYA Agent</span>}
        {m.author === 'human' && <span className="rounded bg-sunk px-1.5 py-px font-semibold text-fg2">Team</span>}
        <span className="sr-only">{m.author === 'customer' ? 'Customer' : m.author === 'ai' ? 'AI' : 'Human agent'}: </span>
        {m.author !== 'ai' && <><span>{who}</span><span aria-hidden>·</span></>}<time dateTime={new Date(m.at).toISOString()}>{shortTime(m.at)}</time>
      </p>
      <div className={cx('max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed sm:max-w-[72%]',
        m.author === 'customer' ? 'rounded-tl-md border border-edge bg-panel text-fg' : m.author === 'ai' ? 'rounded-tr-md border border-accent/25 bg-accent-soft text-fg' : 'rounded-tr-md bg-fg text-canvas')}>
        {m.text}
        {m.attachments?.map((a) => <span key={a} className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-black/10 px-2 py-1 text-xs"><Paperclip className="h-3 w-3" aria-hidden />{a}</span>)}
      </div>
    </li>
  )
}
