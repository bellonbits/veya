import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Plus, X } from 'lucide-react'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { usePermission } from '../../hooks'
import type { ConversationDetail } from '../../services/inbox'
import { Avatar, Badge, LeadBadge, Card } from '../../components/ui/Display'
import { InlineEdit } from '../../components/ui/InlineEdit'
import { Select } from '../../components/ui/Form'
import { ActivityTimeline, ChannelTag, Owner } from '../../components/domain/Common'
import { dueLabel, kes, ago } from '../../lib/format'
import { STATUS_ORDER, type LeadStatus } from '../../types'
import { USERS } from '../../data/seed'
import { Button } from '../../components/ui/Button'

const H = ({ children, action }: { children: string; action?: React.ReactNode }) => <div className="mb-2 flex items-center justify-between"><h3 className="text-[11px] font-semibold uppercase tracking-[0.09em] text-fg3">{children}</h3>{action}</div>

/** Customer + CRM context. Edits here write straight to the CRM records — Inbox and CRM are one dataset. */
export function CustomerPanel({ d }: { d: ConversationDetail }) {
  const { customer: c, lead, company, conversation } = d
  const db = useDb.getState(), canWrite = usePermission('crm.write'), toast = useUi((s) => s.toast)
  const [tag, setTag] = useState(''), [field, setField] = useState('')
  const team = USERS.filter((u) => u.orgId === c.orgId)
  const upd = (patch: Partial<typeof c>) => db.updateCustomer(c.id, patch)
  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-3">
        <Avatar name={c.name} size={44} />
        <div className="min-w-0"><Link to={`/app/crm/contacts/${c.id}`} className="flex items-center gap-1 truncate text-base font-semibold text-fg hover:text-accent-ink">{c.name}<ExternalLink className="h-3 w-3" aria-hidden /></Link>
          <p className="text-xs text-fg3">Customer since {new Date(c.createdAt).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}</p></div>
      </div>

      <section aria-label="Profile"><H>Profile</H>
        <dl className="space-y-0.5">
          {([['Name', 'name', c.name], ['Phone', 'phone', c.phone], ['Email', 'email', c.email], ['Location', 'location', c.location]] as const).map(([l, k, v]) => (
            <div key={k} className="grid grid-cols-[4.5rem_1fr] items-center gap-2"><dt className="text-xs text-fg3">{l}</dt><dd><InlineEdit label={l} value={v} disabled={!canWrite} type={k === 'email' ? 'email' : 'text'} onSave={(nv) => { if (k === 'name' && !nv) return; upd({ [k]: nv }); toast({ tone: 'success', title: `${l} updated` }) }} /></dd></div>
          ))}
        </dl>
      </section>

      <section aria-label="Tags"><H>Tags</H>
        <div className="flex flex-wrap gap-1.5">
          {c.tags.map((t) => <Badge key={t} tone="accent" className="gap-1">{t}{canWrite && <button type="button" aria-label={`Remove tag ${t}`} onClick={() => upd({ tags: c.tags.filter((x) => x !== t) })}><X className="h-3 w-3" /></button>}</Badge>)}
          {canWrite && <form onSubmit={(e) => { e.preventDefault(); if (tag.trim()) { upd({ tags: [...new Set([...c.tags, tag.trim().toLowerCase()])] }); setTag('') } }}>
            <input aria-label="Add tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="+ tag" className="h-6 w-16 rounded-md bg-transparent px-1.5 text-xs text-fg placeholder:text-fg3 hover:bg-sunk focus:w-24 focus:bg-sunk focus:outline-none" /></form>}
        </div>
      </section>

      <section aria-label="Lead"><H action={lead && <Link to={`/app/crm/leads/${lead.id}`} className="text-xs font-semibold text-accent-ink hover:underline">Open in CRM</Link>}>Lead</H>
        {lead ? (
          <Card className="space-y-3 !p-3">
            <div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-fg">Lead #{lead.number}</p><p className="text-[13px] text-fg2">{lead.title}</p></div><LeadBadge status={lead.status} /></div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-fg3">Status<Select aria-label="Lead status" disabled={!canWrite} value={lead.status} onChange={(e) => { db.updateLead(lead.id, { status: e.target.value as LeadStatus }); toast({ tone: 'success', title: `Lead moved to ${e.target.value}`, href: `/app/crm/leads/${lead.id}`, action: 'View lead' }) }} className="mt-1 h-8 text-[13px]">{STATUS_ORDER.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</Select></label>
              <label className="text-xs text-fg3">Owner<Select aria-label="Lead owner" disabled={!canWrite} value={lead.ownerId ?? ''} onChange={(e) => db.assignLead(lead.id, e.target.value || undefined)} className="mt-1 h-8 text-[13px]"><option value="">Unassigned</option>{team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></label>
            </div>
            <div className="flex items-center justify-between text-sm"><span className="text-fg3">Value</span><span className="num font-semibold text-fg">{kes(lead.value)}</span></div>
            {Object.keys(lead.qualification).length > 0 && <dl className="space-y-1 border-t border-edge pt-2 text-[13px]">{Object.entries(lead.qualification).slice(0, 5).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-fg3">{k}</dt><dd className="text-right text-fg">{v}</dd></div>)}</dl>}
          </Card>
        ) : (
          <div className="rounded-xl border border-dashed border-edge2 p-3 text-center"><p className="text-sm text-fg2">No lead for this conversation yet.</p>
            <Button className="mt-2" size="sm" disabled={!canWrite} icon={<Plus className="h-3.5 w-3.5" />} onClick={() => { const l = db.createLeadFromConversation(conversation.id); if (l) toast({ tone: 'success', title: `Lead #${l.number} created`, href: `/app/crm/leads/${l.id}`, action: 'Open in CRM' }) }}>Create lead</Button></div>
        )}
      </section>

      {company && <section aria-label="Company"><H>Company</H><Link to={`/app/crm/companies/${company.id}`} className="block rounded-lg border border-edge p-2.5 hover:bg-sunk"><p className="text-sm font-semibold text-fg">{company.name}</p><p className="text-xs text-fg3">{company.industry} · {company.location}</p></Link></section>}

      <section aria-label="Custom fields"><H>Custom fields</H>
        <dl className="space-y-0.5">
          {Object.entries(c.custom).map(([k, v]) => <div key={k} className="grid grid-cols-[6rem_1fr] items-center gap-2"><dt className="truncate text-xs text-fg3">{k}</dt><dd><InlineEdit label={k} value={v} disabled={!canWrite} onSave={(nv) => upd({ custom: { ...c.custom, [k]: nv } })} /></dd></div>)}
        </dl>
        {canWrite && <form className="mt-1" onSubmit={(e) => { e.preventDefault(); if (field.trim()) { upd({ custom: { ...c.custom, [field.trim()]: '' } }); setField('') } }}><input aria-label="Add custom field" value={field} onChange={(e) => setField(e.target.value)} placeholder="+ add field" className="h-7 w-full rounded-md bg-transparent px-1.5 text-xs text-fg placeholder:text-fg3 hover:bg-sunk focus:bg-sunk focus:outline-none" /></form>}
      </section>

      <section aria-label="Open tasks"><H>Open tasks</H>
        {d.openTasks.length === 0 ? <p className="text-sm text-fg3">No open tasks.</p> : <ul className="space-y-1.5">{d.openTasks.map((t) => (
          <li key={t.id} className="flex items-start gap-2 text-sm"><input type="checkbox" aria-label={`Complete task: ${t.title}`} className="mt-1 h-4 w-4 accent-[var(--c-accent)]" onChange={() => db.toggleTask(t.id)} /><span><span className="text-fg">{t.title}</span><span className="block text-xs text-fg3">{dueLabel(t.dueAt)}</span></span></li>))}</ul>}
      </section>

      {d.otherConversations.length > 0 && <section aria-label="Recent conversations"><H>Recent conversations</H><ul className="space-y-1">{d.otherConversations.map((o) => <li key={o.id}><Link to={`/app/inbox/${o.id}`} className="flex items-center justify-between rounded-md px-1.5 py-1 text-sm hover:bg-sunk"><ChannelTag channel={o.channel} /><span className="text-xs text-fg3">{ago(o.lastMessageAt)}</span></Link></li>)}</ul></section>}

      <section aria-label="Timeline"><H>Timeline</H><ActivityTimeline items={d.timeline} limit={8} /></section>
      <div className="text-xs text-fg3">Owner: <Owner id={c.ownerId} /></div>
    </div>
  )
}
