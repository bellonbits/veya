import { useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { GripVertical, MoveRight } from 'lucide-react'
import type { LeadRow } from '../../services/crm'
import { STATUS_ORDER, type LeadStatus } from '../../types'
import { Dropdown } from '../ui/Overlay'
import { Owner } from './Common'
import { Avatar } from '../ui/Display'
import { ago, cap, cx, kes } from '../../lib/format'

export function LeadCard({ lead, onMove }: { lead: LeadRow; onMove: (id: string, to: LeadStatus) => void }) {
  return (
    <article draggable onDragStart={(e: DragEvent) => { e.dataTransfer.setData('text/lead', lead.id); e.dataTransfer.effectAllowed = 'move' }}
      className="group cursor-grab rounded-lg border border-edge bg-panel p-3 shadow-[0_1px_0_rgb(0_0_0/0.02)] transition hover:border-edge2 hover:shadow-sm active:cursor-grabbing">
      <div className="flex items-start gap-2">
        <Avatar name={lead.customerName} size={26} />
        <div className="min-w-0 flex-1">
          <Link to={`/app/crm/leads/${lead.id}`} className="block truncate text-sm font-semibold text-fg hover:text-accent-ink">{lead.customerName}</Link>
          <p className="truncate text-xs text-fg3">{lead.companyName ?? lead.source}</p>
        </div>
        <GripVertical className="h-4 w-4 shrink-0 text-fg3 opacity-0 transition group-hover:opacity-100" aria-hidden />
      </div>
      <p className="mt-2 truncate text-[13px] text-fg2">{lead.title}</p>
      <div className="mt-2 flex items-center justify-between"><span className="num text-sm font-semibold text-fg">{kes(lead.value)}</span><span className="text-xs text-fg3">{ago(lead.lastActivityAt)}</span></div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-edge pt-2 text-xs">
        <span className="min-w-0 text-fg2"><Owner id={lead.ownerId} name={lead.ownerName} /></span>
        <Dropdown label={`Move ${lead.customerName}`} trigger={<span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-fg3 hover:bg-sunk hover:text-fg"><MoveRight className="h-3 w-3" aria-hidden />Move</span>}
          items={STATUS_ORDER.filter((s) => s !== lead.status).map((s) => ({ label: cap(s), onSelect: () => onMove(lead.id, s) }))} />
      </div>
      {lead.nextAction !== '—' && <p className="mt-1.5 truncate text-xs text-fg3">Next: {lead.nextAction}</p>}
    </article>
  )
}

export function PipelineColumn({ status, leads, onMove, limit = 20 }: { status: LeadStatus; leads: LeadRow[]; onMove: (id: string, to: LeadStatus) => void; limit?: number }) {
  const [over, setOver] = useState(false)
  const total = leads.reduce((a, l) => a + l.value, 0)
  return (
    <section aria-label={`${cap(status)} column`} onDragOver={(e) => { if (e.dataTransfer.types.includes('text/lead')) { e.preventDefault(); setOver(true) } }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const id = e.dataTransfer.getData('text/lead'); if (id) onMove(id, status) }}
      className={cx('flex w-[272px] shrink-0 snap-start flex-col rounded-xl border bg-sunk/60 transition', over ? 'border-accent bg-accent-soft/40' : 'border-edge')}>
      <header className="flex items-center justify-between px-3 py-2.5">
        <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-fg2">{status}<span className="num rounded bg-panel px-1.5 py-px text-[11px] text-fg">{leads.length}</span></h3>
        <span className="num text-xs text-fg3">{kes(total)}</span>
      </header>
      <div className="scroll-thin flex max-h-[calc(100svh-15rem)] min-h-24 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {leads.slice(0, limit).map((l) => <LeadCard key={l.id} lead={l} onMove={onMove} />)}
        {leads.length === 0 && <p className="rounded-lg border border-dashed border-edge2 px-3 py-6 text-center text-xs text-fg3">Drop a lead here</p>}
        {leads.length > limit && <Link to={`/app/crm/leads?status=${status}`} className="py-1.5 text-center text-xs font-semibold text-accent-ink hover:underline">+{leads.length - limit} more in Leads</Link>}
      </div>
    </section>
  )
}
