import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MessageSquare, Play, Plus } from 'lucide-react'
import { Page } from '../../layouts/Page'
import { useOrg, usePermission, useService } from '../../hooks'
import { getLead } from '../../services/crm'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { Avatar, Card, DefList, LeadBadge, PageHeader, SectionHeader, StatusBadge } from '../../components/ui/Display'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Form'
import { InlineEdit } from '../../components/ui/InlineEdit'
import { Dropdown } from '../../components/ui/Overlay'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { ActivityTimeline, ChannelTag, Owner } from '../../components/domain/Common'
import { ago, dueLabel, duration, kes } from '../../lib/format'
import { STATUS_ORDER, type LeadStatus } from '../../types'
import { USERS } from '../../data/seed'

export default function LeadDetail() {
  const { id = '' } = useParams(), nav = useNavigate()
  const { orgId } = useOrg()
  const { data: d, error, refetch } = useService(`lead-${id}`, () => getLead(orgId, id), [id])
  const db = useDb.getState(), canWrite = usePermission('crm.write'), toast = useUi((s) => s.toast)
  const workflows = useDb((s) => s.workflows).filter((w) => w.orgId === orgId && w.status === 'active')
  const [note, setNote] = useState('')
  const back = <Link to="/app/crm/leads" className="mb-3 inline-flex items-center gap-1.5 text-sm text-fg2 hover:text-fg"><ArrowLeft className="h-4 w-4" />Leads</Link>
  if (error) return <Page><ErrorState error={error} onRetry={refetch} back={{ to: '/app/crm/leads', label: 'Back to leads' }} /></Page>
  if (!d) return <Page><LoadingState rows={6} label="Loading lead" /></Page>
  const { lead, customer, company, conversations, tasks, runs, activities } = d
  const team = USERS.filter((u) => u.orgId === orgId)
  const conv = conversations.find((c) => c.leadId === lead.id) ?? conversations[0]
  return (
    <Page>
      <title>{`Lead #${lead.number} · ${customer.name}`}</title>
      <PageHeader back={back} title={<span className="flex flex-wrap items-center gap-3">{customer.name}<LeadBadge status={lead.status} /></span>}
        sub={<>Lead #{lead.number} · {lead.title} · created {ago(lead.createdAt)} from {lead.source}</>}
        actions={<>
          {conv && <Button icon={<MessageSquare className="h-4 w-4" />} onClick={() => nav(`/app/inbox/${conv.id}`)}>Open conversation</Button>}
          <Dropdown label="Run workflow" trigger={<span className="inline-flex h-9 items-center gap-2 rounded-lg border border-edge2 bg-panel px-3.5 text-sm font-semibold text-fg hover:bg-sunk"><Play className="h-4 w-4" />Run workflow</span>}
            items={workflows.length ? workflows.map((w) => ({ label: w.name, disabled: !canWrite, onSelect: () => { const r = db.triggerWorkflow(w.id, { leadId: lead.id, customerId: customer.id, conversationId: conv?.id }); if (r) toast({ tone: r.status === 'failed' ? 'error' : 'success', title: `${w.name} ${r.status}`, href: `/app/flows/runs/${r.id}`, action: 'View run' }) } })) : [{ label: 'No active workflows', disabled: true, onSelect: () => {} }]} />
        </>} />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <SectionHeader title="Deal" />
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-xs font-semibold text-fg3">Status<Select className="mt-1.5" disabled={!canWrite} aria-label="Status" value={lead.status} onChange={(e) => { db.updateLead(lead.id, { status: e.target.value as LeadStatus }); toast({ tone: 'success', title: `Moved to ${e.target.value}` }) }}>{STATUS_ORDER.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</Select></label>
              <label className="text-xs font-semibold text-fg3">Owner<Select className="mt-1.5" disabled={!canWrite} aria-label="Owner" value={lead.ownerId ?? ''} onChange={(e) => db.assignLead(lead.id, e.target.value || undefined)}><option value="">Unassigned</option>{team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></label>
              <div className="text-xs font-semibold text-fg3">Value (KES)<div className="mt-1.5 rounded-lg border border-edge2 px-2.5 py-1"><InlineEdit label="Value" disabled={!canWrite} value={String(lead.value)} onSave={(v) => { const n = Number(v.replace(/[, ]/g, '')); if (!Number.isNaN(n)) db.updateLead(lead.id, { value: n }) }} /></div><p className="mt-1 font-normal text-fg3">{kes(lead.value)}</p></div>
            </div>
            <dl className="mt-4 grid gap-x-8 gap-y-2 border-t border-edge pt-4 text-sm sm:grid-cols-2">
              {Object.entries(lead.qualification).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-fg3">{k}</dt><dd className="text-right font-medium text-fg">{v}</dd></div>)}
              <div className="flex justify-between gap-3"><dt className="text-fg3">Lead score</dt><dd className="num font-medium text-fg">{lead.score}/100</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-fg3">Next action</dt><dd className="text-right font-medium text-fg">{lead.nextAction}</dd></div>
            </dl>
          </Card>

          <Card>
            <SectionHeader title="Activity" sub="Conversations, status changes, tasks, notes and workflow runs" />
            {canWrite && <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) { db.addNote({ leadId: lead.id, customerId: customer.id }, note.trim()); setNote('') } }}><Input aria-label="Add a note" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} /><Button type="submit" disabled={!note.trim()}>Add note</Button></form>}
            {activities.length ? <ActivityTimeline items={activities} limit={20} /> : <p className="text-sm text-fg3">No activity recorded yet.</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionHeader title="Contact" action={<Link className="text-xs font-semibold text-accent-ink hover:underline" to={`/app/crm/contacts/${customer.id}`}>Open</Link>} />
            <div className="mb-3 flex items-center gap-3"><Avatar name={customer.name} size={40} /><div><p className="text-sm font-semibold text-fg">{customer.name}</p><p className="text-xs text-fg3">{customer.location}</p></div></div>
            <DefList items={[['Phone', customer.phone], ['Email', customer.email], ['Company', company ? <Link className="text-accent-ink hover:underline" to={`/app/crm/companies/${company.id}`}>{company.name}</Link> : ''], ['Source', lead.source], ['Owner', <Owner id={lead.ownerId} />], ['Created by', lead.createdBy === 'ai' ? 'VEYA Agent' : lead.createdBy === 'workflow' ? 'Workflow' : 'Team member']]} />
          </Card>

          <Card>
            <SectionHeader title="Related conversations" />
            {conversations.length === 0 ? <p className="text-sm text-fg3">No conversations linked to this lead.</p> : <ul className="space-y-1">{conversations.map((c) => (
              <li key={c.id}><Link to={`/app/inbox/${c.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-sunk"><span className="flex items-center gap-2"><ChannelTag channel={c.channel} /><StatusBadge status={c.status} /></span><span className="flex items-center gap-1 text-xs text-fg3">{ago(c.lastMessageAt)}<ExternalLink className="h-3 w-3" aria-hidden /></span></Link></li>))}</ul>}
          </Card>

          <Card>
            <SectionHeader title="Workflows triggered" />
            {runs.length === 0 ? <p className="text-sm text-fg3">No workflow has run for this lead.</p> : <ul className="space-y-2">{runs.slice(0, 6).map((r) => (
              <li key={r.id} className="rounded-lg border border-edge p-2.5 text-sm"><div className="flex items-center justify-between gap-2"><Link to={`/app/flows/${r.workflowId}`} className="font-semibold text-fg hover:text-accent-ink">{r.workflowName}</Link><StatusBadge status={r.status} /></div>
                <p className="mt-1 flex items-center justify-between text-xs text-fg3"><span>{ago(r.startedAt)}{r.completedAt ? ` · ${duration(r.completedAt - r.startedAt)}` : ''}</span><Link className="font-semibold text-accent-ink hover:underline" to={`/app/flows/runs/${r.id}`}>View run</Link></p></li>))}</ul>}
          </Card>

          <Card>
            <SectionHeader title="Tasks" action={canWrite ? <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => { const t = db.createTask({ title: `Follow up with ${customer.name.split(' ')[0]}`, dueAt: Date.now() + 86_400_000, leadId: lead.id, customerId: customer.id }); toast({ tone: 'success', title: 'Task created', body: t.title }) }}>Add</Button> : undefined} />
            {tasks.length === 0 ? <p className="text-sm text-fg3">No tasks for this lead.</p> : <ul className="space-y-2">{tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-2.5 text-sm"><input type="checkbox" checked={t.status === 'done'} disabled={!canWrite} onChange={() => db.toggleTask(t.id)} aria-label={`Mark done: ${t.title}`} className="mt-1 h-4 w-4 accent-[var(--c-accent)]" />
                <span className={t.status === 'done' ? 'text-fg3 line-through' : 'text-fg'}>{t.title}<span className="block text-xs text-fg3 no-underline">{t.status === 'done' ? 'Done' : dueLabel(t.dueAt)}</span></span></li>))}</ul>}
          </Card>
        </div>
      </div>
    </Page>
  )
}
