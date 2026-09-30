import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { useOrg } from '../../hooks'
import { Modal } from '../../components/ui/Overlay'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Form'
import { USERS } from '../../data/seed'
import type { Channel, LeadSource } from '../../types'
import { DAY } from '../../lib/format'

const TITLES = { lead: 'New lead', contact: 'New contact', conversation: 'New conversation', workflow: 'New workflow', task: 'New task' } as const
const SOURCES: LeadSource[] = ['WhatsApp', 'Website', 'Referral', 'Facebook Ads', 'Email', 'Walk-in']

export function QuickCreateModal() {
  const kind = useUi((s) => s.quickCreate), close = () => useUi.getState().setQuickCreate(null), toast = useUi((s) => s.toast)
  const { orgId } = useOrg(), nav = useNavigate(), db = useDb.getState
  const customers = useDb((s) => s.customers).filter((c) => c.orgId === orgId).sort((a, b) => a.name.localeCompare(b.name))
  const team = USERS.filter((u) => u.orgId === orgId)
  const [f, setF] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => { setF({}); setErrors({}) }, [kind])
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const err: Record<string, string> = {}
    const need = (k: string, msg: string) => { if (!f[k]?.trim()) err[k] = msg }
    if (kind === 'lead') { need('customerId', 'Choose a customer'); need('title', 'Describe the opportunity') }
    if (kind === 'contact') { need('name', 'Enter a name'); if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) err.email = 'Enter a valid email address' }
    if (kind === 'conversation') need('customerId', 'Choose a customer')
    if (kind === 'workflow') need('name', 'Name your workflow')
    if (kind === 'task') need('title', 'Describe the task')
    setErrors(err)
    if (Object.keys(err).length) return
    const s = db()
    if (kind === 'lead') { const l = s.createLead({ customerId: f.customerId, title: f.title, source: (f.source as LeadSource) || 'Website', value: Number(f.value) || 0, ownerId: f.ownerId || undefined }); toast({ tone: 'success', title: `Lead #${l.number} created`, href: `/app/crm/leads/${l.id}`, action: 'Open lead' }); nav(`/app/crm/leads/${l.id}`) }
    if (kind === 'contact') { const c = s.createCustomer({ name: f.name.trim(), phone: f.phone ?? '', email: f.email ?? '', location: f.location ?? '' }); toast({ tone: 'success', title: `${c.name} added`, href: `/app/crm/contacts/${c.id}`, action: 'Open contact' }); nav(`/app/crm/contacts/${c.id}`) }
    if (kind === 'conversation') { const cv = s.createConversation(f.customerId, (f.channel as Channel) || 'whatsapp', { handledBy: 'human', assigneeId: s.leads.find((l) => l.customerId === f.customerId)?.ownerId, agentId: undefined }); nav(`/app/inbox/${cv.id}`) }
    if (kind === 'workflow') { const w = s.createWorkflow({ name: f.name.trim(), description: f.description ?? '', nodes: [{ id: 't1', type: 'trigger', position: { x: 200, y: 0 }, data: { kind: 'trigger.new_lead', label: 'New Lead', params: {} } }], edges: [] }); nav(`/app/flows/${w.id}/builder`) }
    if (kind === 'task') { const t = s.createTask({ title: f.title.trim(), dueAt: new Date(f.due || Date.now() + DAY).getTime(), priority: (f.priority as 'low') || 'medium', assigneeId: f.assigneeId || undefined, customerId: f.customerId || undefined }); toast({ tone: 'success', title: 'Task created', body: t.title, href: '/app/crm/tasks', action: 'View tasks' }) }
    close()
  }
  const customerSelect = (required: boolean) => (
    <Field label="Customer" error={errors.customerId}>{(id) => (
      <Select id={id} value={f.customerId ?? ''} onChange={set('customerId')} aria-invalid={!!errors.customerId}><option value="">{required ? 'Select a customer…' : 'None'}</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>)}</Field>
  )
  return (
    <Modal open={!!kind} onClose={close} title={kind ? TITLES[kind] : ''} footer={<><Button onClick={close}>Cancel</Button><Button variant="accent" type="submit" form="qc-form">Create</Button></>}>
      <form id="qc-form" onSubmit={submit} noValidate className="space-y-4">
        {kind === 'lead' && <>
          {customerSelect(true)}
          <Field label="What are they after?" error={errors.title}>{(id) => <Input id={id} value={f.title ?? ''} onChange={set('title')} placeholder="2-bedroom apartment — Kilimani" invalid={!!errors.title} />}</Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">{(id) => <Select id={id} value={f.source ?? 'Website'} onChange={set('source')}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
            <Field label="Value (KES)">{(id) => <Input id={id} inputMode="numeric" value={f.value ?? ''} onChange={set('value')} placeholder="960000" />}</Field>
          </div>
          <Field label="Owner">{(id) => <Select id={id} value={f.ownerId ?? ''} onChange={set('ownerId')}><option value="">Unassigned</option>{team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>}</Field>
        </>}
        {kind === 'contact' && <>
          <Field label="Full name" error={errors.name}>{(id) => <Input id={id} value={f.name ?? ''} onChange={set('name')} invalid={!!errors.name} autoComplete="off" />}</Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">{(id) => <Input id={id} type="tel" value={f.phone ?? ''} onChange={set('phone')} placeholder="+254 7…" />}</Field>
            <Field label="Email" error={errors.email}>{(id) => <Input id={id} type="email" value={f.email ?? ''} onChange={set('email')} invalid={!!errors.email} />}</Field>
          </div>
          <Field label="Location">{(id) => <Input id={id} value={f.location ?? ''} onChange={set('location')} />}</Field>
        </>}
        {kind === 'conversation' && <>
          {customerSelect(true)}
          <Field label="Channel" hint="Outbound messages need a connected channel in production.">{(id) => <Select id={id} value={f.channel ?? 'whatsapp'} onChange={set('channel')}><option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="website">Website chat</option></Select>}</Field>
        </>}
        {kind === 'workflow' && <>
          <Field label="Workflow name" error={errors.name}>{(id) => <Input id={id} value={f.name ?? ''} onChange={set('name')} invalid={!!errors.name} placeholder="Viewing reminder" />}</Field>
          <Field label="Description">{(id) => <Input id={id} value={f.description ?? ''} onChange={set('description')} />}</Field>
          <p className="text-sm text-fg2">You'll continue in the visual builder. The workflow starts as a draft.</p>
        </>}
        {kind === 'task' && <>
          <Field label="Task" error={errors.title}>{(id) => <Input id={id} value={f.title ?? ''} onChange={set('title')} invalid={!!errors.title} placeholder="Follow up with John regarding Kilimani apartment" />}</Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due">{(id) => <Input id={id} type="datetime-local" value={f.due ?? ''} onChange={set('due')} />}</Field>
            <Field label="Priority">{(id) => <Select id={id} value={f.priority ?? 'medium'} onChange={set('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select>}</Field>
          </div>
          <Field label="Assignee">{(id) => <Select id={id} value={f.assigneeId ?? ''} onChange={set('assigneeId')}><option value="">Me</option>{team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>}</Field>
          {customerSelect(false)}
        </>}
      </form>
    </Modal>
  )
}
