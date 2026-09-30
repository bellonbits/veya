import { useMemo, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Page } from '../../layouts/Page'
import { SETTINGS_NAV } from '../../layouts/nav'
import { useOrg, usePermission, useDebounced, useService } from '../../hooks'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { usePref } from '../../store/settings'
import { ORGS, USERS } from '../../data/seed'
import { inviteUser, setUserRole } from '../../services/team'
import { ROLE_BLURB, ROLE_LABEL, ROLE_PERMISSIONS, can } from '../../lib/permissions'
import { Avatar, Badge, Card, DefList, PageHeader, SectionHeader, StatusBadge } from '../../components/ui/Display'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Switch } from '../../components/ui/Form'
import { Modal } from '../../components/ui/Overlay'
import { EmptyState, NoPermission } from '../../components/ui/States'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { cx, dateTime } from '../../lib/format'
import type { AuditEntry, Permission, Role } from '../../types'
import { listTeam } from '../../services/crm'

export function SettingsLayout() {
  const { role } = useOrg()
  return (
    <Page>
      <title>Settings · VEYA</title>
      <PageHeader title="Settings" sub="Organization, team, channels and security" />
      <div className="grid gap-6 md:grid-cols-[13rem_1fr]">
        <nav aria-label="Settings sections" className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1 md:mx-0 md:flex-col md:px-0">
          {SETTINGS_NAV.filter((n) => !n.perm || can(role, n.perm)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/app/settings'} className={({ isActive }) => cx('whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition', isActive ? 'bg-accent-soft text-accent-ink' : 'text-fg2 hover:bg-sunk hover:text-fg')}>{n.label}</NavLink>))}
        </nav>
        <div className="min-w-0 space-y-4"><Outlet /></div>
      </div>
    </Page>
  )
}

export function OrganizationSettings() {
  const { org } = useOrg(), leads = useDb((s) => s.leads.filter((l) => l.orgId === org.id).length), convs = useDb((s) => s.conversations.filter((c) => c.orgId === org.id).length)
  return (<>
    <Card><SectionHeader title="Organization" sub="Every record in VEYA belongs to exactly one organization." />
      <DefList items={[['Name', org.name], ['Workspace URL', `veya.tech/${org.slug}`], ['Industry', org.industry], ['Region', org.region], ['Plan', org.plan], ['Organization ID', <code className="text-xs">{org.id}</code>]]} />
      <p className="mt-3 text-xs text-fg3">Editing organization details arrives with the API. Data here is isolated per organization: {leads} leads and {convs} conversations belong to this workspace.</p></Card>
    <Card><SectionHeader title="Demo data" sub="Everything you create in this prototype is stored in this browser tab only." />
      <Button onClick={() => { useDb.getState().reset(); useUi.getState().toast({ tone: 'success', title: 'Demo data reset' }) }}>Reset demo data</Button></Card>
    <Card><SectionHeader title="Your workspaces" />
      <ul className="divide-y divide-edge">{ORGS.map((o) => <li key={o.id} className="flex items-center justify-between py-2.5 text-sm"><span><b className="font-semibold text-fg">{o.name}</b> <span className="text-fg3">· {o.industry}</span></span>{o.id === org.id ? <Badge tone="accent">Current</Badge> : <span className="text-xs text-fg3">Switch from the top bar</span>}</li>)}</ul></Card>
  </>)
}

export function ProfileSettings() {
  const { user, role } = useOrg(), toast = useUi((s) => s.toast)
  const [name, setName] = usePref('profile.name', user.name), [title, setTitle] = usePref('profile.title', user.title)
  const [n, setN] = useState(name), [t, setT] = useState(title)
  return (
    <Card><SectionHeader title="Profile" />
      <form className="max-w-md space-y-4" onSubmit={(e) => { e.preventDefault(); setName(n.trim() || user.name); setTitle(t); toast({ tone: 'success', title: 'Profile saved on this device' }) }}>
        <div className="flex items-center gap-3"><Avatar name={n || user.name} hue={user.hue} size={48} /><div><p className="text-sm font-semibold text-fg">{user.email}</p><p className="text-xs text-fg3">{ROLE_LABEL[role]}</p></div></div>
        <Field label="Full name">{(id) => <Input id={id} value={n} onChange={(e) => setN(e.target.value)} />}</Field>
        <Field label="Job title">{(id) => <Input id={id} value={t} onChange={(e) => setT(e.target.value)} />}</Field>
        <Button type="submit" variant="accent">Save profile</Button></form></Card>
  )
}

export function TeamSettings() {
  const { orgId, user: me } = useOrg(), canManage = usePermission('team.manage'), toast = useUi((s) => s.toast)
  const rev = useDb((s) => s.rev)
  const { data } = useService('team', () => listTeam(orgId))
  const [open, setOpen] = useState(false), [f, setF] = useState({ name: '', email: '', role: 'agent' as Role }), [err, setErr] = useState<Record<string, string>>({})
  const rows = useMemo(() => (data ?? []).map((u) => ({ ...u })), [data, rev])
  const leads = useDb((s) => s.leads)
  const cols: Column<(typeof rows)[number]>[] = [
    { id: 'n', header: 'Member', cell: (u) => <span className="flex items-center gap-2.5"><Avatar name={u.name} hue={u.hue} size={30} /><span className="min-w-0"><span className="block truncate font-semibold">{u.name}{u.id === me.id && <Badge className="ml-2">You</Badge>}</span><span className="block truncate text-xs text-fg3">{u.email}</span></span></span> },
    { id: 't', header: 'Title', cell: (u) => <span className="text-fg2">{u.title}</span> },
    { id: 'l', header: 'Open leads', align: 'right', cell: (u) => <span className="num">{leads.filter((l) => l.ownerId === u.id && l.status !== 'won' && l.status !== 'lost').length}</span> },
    { id: 'r', header: 'Role', cell: (u) => canManage && u.id !== me.id ? <Select aria-label={`Role for ${u.name}`} className="h-8 w-32" value={u.role} onChange={(e) => { setUserRole(orgId, u.id, e.target.value as Role); toast({ tone: 'success', title: `${u.name} is now ${ROLE_LABEL[e.target.value as Role]}` }) }}>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select> : <Badge>{ROLE_LABEL[u.role]}</Badge> },
  ]
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (!f.name.trim()) er.name = 'Enter a name'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email address'
    if (USERS.some((u) => u.orgId === orgId && u.email === f.email)) er.email = 'This person is already on the team'
    setErr(er); if (Object.keys(er).length) return
    inviteUser(orgId, f.name.trim(), f.email.trim(), f.role); toast({ tone: 'info', title: `${f.name} added`, body: 'Email invitations are sent once the API is connected.' }); setOpen(false); setF({ name: '', email: '', role: 'agent' })
  }
  return (<>
    <Card pad={false}><div className="flex items-center justify-between p-4 pb-2 sm:p-5 sm:pb-2"><SectionHeader title="Team" sub={`${rows.length} members`} /><Button variant="accent" disabled={!canManage} onClick={() => setOpen(true)}>Invite member</Button></div>
      <DataTable caption="Team members" columns={cols} rows={rows} rowKey={(u) => u.id} loading={!data} /></Card>
    <Modal open={open} onClose={() => setOpen(false)} title="Invite a team member" footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="accent" type="submit" form="inv">Send invite</Button></>}>
      <form id="inv" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Full name" error={err.name}>{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} invalid={!!err.name} />}</Field>
        <Field label="Work email" error={err.email}>{(id) => <Input id={id} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} invalid={!!err.email} />}</Field>
        <Field label="Role" hint={ROLE_BLURB[f.role]}>{(id) => <Select id={id} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</Select>}</Field></form></Modal>
  </>)
}

const PERM_LABEL: Record<Permission, string> = { 'inbox.reply': 'Reply in Inbox', 'crm.write': 'Edit CRM records', 'crm.delete': 'Delete CRM records', 'agent.manage': 'Manage AI agents', 'flows.manage': 'Build and run workflows', 'analytics.view': 'View analytics', 'team.manage': 'Manage team and roles', 'billing.manage': 'Manage billing', 'security.manage': 'Manage security', 'audit.view': 'View audit log', 'integrations.manage': 'Manage integrations' }
export function RolesSettings() {
  const roles = Object.keys(ROLE_LABEL) as Role[]
  return (
    <Card pad={false}><div className="p-4 pb-2 sm:p-5 sm:pb-2"><SectionHeader title="Roles & permissions" sub="Navigation and actions across VEYA follow these rules. Use “View as” in the account menu to preview a role." /></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><caption className="sr-only">Permissions by role</caption>
        <thead><tr className="border-y border-edge text-left"><th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-fg3">Permission</th>{roles.map((r) => <th key={r} scope="col" className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-fg3">{ROLE_LABEL[r]}</th>)}</tr></thead>
        <tbody>{(Object.keys(PERM_LABEL) as Permission[]).map((p) => <tr key={p} className="border-b border-edge/60 last:border-0"><th scope="row" className="px-5 py-2.5 text-left font-medium text-fg">{PERM_LABEL[p]}</th>{roles.map((r) => <td key={r} className="px-3 py-2.5 text-center">{ROLE_PERMISSIONS[r].includes(p) ? <span className="font-semibold text-ok"><span aria-hidden>✓</span><span className="sr-only">Allowed</span></span> : <span className="text-fg3"><span aria-hidden>—</span><span className="sr-only">Not allowed</span></span>}</td>)}</tr>)}</tbody></table></div></Card>
  )
}

type ConnState = 'connected' | 'available' | 'coming soon'
function ConnCard({ name, desc, state, note }: { name: string; desc: string; state: ConnState; note?: string }) {
  const toast = useUi((s) => s.toast), canManage = usePermission('integrations.manage')
  return (
    <Card className="flex flex-col"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold text-fg">{name}</h3><StatusBadge status={state} /></div>
      <p className="mt-1 flex-1 text-sm text-fg2">{desc}</p>{note && <p className="mt-2 text-xs text-fg3">{note}</p>}
      <Button className="mt-3 self-start" size="sm" disabled={state === 'coming soon' || !canManage} onClick={() => toast({ tone: 'info', title: `${name} can't be connected in this build`, body: 'Live connections need the VEYA API, which is not deployed yet. Nothing here is connected.' })}>{state === 'connected' ? 'Manage' : state === 'available' ? 'Connect' : 'Coming soon'}</Button></Card>
  )
}
export function ChannelSettings() {
  return (<>
    <div role="note" className="rounded-lg border border-edge bg-sunk px-4 py-3 text-sm text-fg2">This workspace runs on <b className="text-fg">demo data</b>. No live channel is connected, so conversations you see were generated for the prototype.</div>
    <div className="grid gap-3 sm:grid-cols-2">
      <ConnCard name="WhatsApp Business" desc="Receive and reply to WhatsApp messages in Inbox, with VEYA Agent answering first." state="available" note="Requires a WhatsApp Business API number." />
      <ConnCard name="Website chat" desc="Embed a chat widget that starts conversations and captures leads." state="available" />
      <ConnCard name="Email" desc="Bring a shared inbox such as sales@ into VEYA Inbox." state="available" />
      <ConnCard name="SMS" desc="Send and receive text messages through a local provider." state="coming soon" />
    </div></>)
}
export function IntegrationSettings() {
  return (<>
    <div role="note" className="rounded-lg border border-edge bg-sunk px-4 py-3 text-sm text-fg2">Nothing on this page is connected yet. Status shows what will be available.</div>
    <div className="grid gap-3 sm:grid-cols-2">
      <ConnCard name="Google Calendar" desc="Book viewings and appointments straight from a conversation." state="available" />
      <ConnCard name="Webhooks" desc="Send workflow events to your own systems, and trigger flows from outside." state="available" note="Signing secrets are generated server-side and never shown in the browser." />
      <ConnCard name="REST API" desc="Read and write leads, customers and conversations at /api/v1." state="available" />
      <ConnCard name="CRM sync" desc="Two-way sync with HubSpot, Zoho and others." state="coming soon" />
      <ConnCard name="M-Pesa payments" desc="Collect deposits and payments inside conversations." state="coming soon" />
    </div></>)
}

export function AiSettings() {
  const { orgId } = useOrg(), agents = useDb((s) => s.agents).filter((a) => a.orgId === orgId)
  const [def, setDef] = usePref('ai.default', agents[0]?.id ?? ''), [h1, setH1] = usePref('ai.humanAfterHours', false), [h2, setH2] = usePref('ai.disclose', true), [h3, setH3] = usePref('ai.autoLead', true)
  return (<Card><SectionHeader title="AI" sub="Defaults for VEYA Agent across this organization" />
    <div className="max-w-xl space-y-5">
      <Field label="Default agent for new conversations">{(id) => <Select id={id} value={def} onChange={(e) => setDef(e.target.value)}>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>}</Field>
      {([['Tell customers they are chatting with an AI assistant', h2, setH2], ['Create a lead automatically once qualification is complete', h3, setH3], ['Hand over to a human outside business hours', h1, setH1]] as const).map(([l, v, s]) => <div key={l} className="flex items-center justify-between gap-4"><span className="text-sm text-fg">{l}</span><Switch label={l} checked={v} onChange={s} /></div>)}
      <p className="border-t border-edge pt-3 text-xs text-fg3">Model providers and API keys are managed on the server. They are never sent to, or stored in, the browser. Preferences on this page are saved on this device until the API is connected.</p></div></Card>)
}
export function NotificationSettings() {
  const items = [['newLead', 'New lead'], ['assigned', 'Lead assigned to me'], ['reply', 'Customer replied'], ['escalation', 'AI escalation'], ['failed', 'Workflow failed'], ['due', 'Task due']] as const
  return (<Card><SectionHeader title="Notifications" sub="What appears in your notification center" />
    <ul className="max-w-xl divide-y divide-edge">{items.map(([k, l]) => <NotifRow key={k} k={k} l={l} />)}</ul></Card>)
}
function NotifRow({ k, l }: { k: string; l: string }) { const [v, s] = usePref(`notif.${k}`, true); return <li className="flex items-center justify-between py-3 text-sm text-fg">{l}<Switch label={l} checked={v} onChange={s} /></li> }

export function BillingSettings() {
  const { org, orgId } = useOrg(), toast = useUi((s) => s.toast), canManage = usePermission('billing.manage')
  const convs = useDb((s) => s.conversations.filter((c) => c.orgId === orgId && Date.now() - c.createdAt < 30 * 86_400_000).length)
  const seats = USERS.filter((u) => u.orgId === orgId).length
  const limit = { Starter: [500, 3], Growth: [3000, 10], Scale: [20000, 50] }[org.plan]
  return (<>
    <Card><SectionHeader title="Plan" /><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xl font-semibold tracking-tight text-fg">{org.plan}</p><p className="text-sm text-fg2">Billing is not connected in this prototype. No payment method is stored.</p></div><Button variant="accent" disabled={!canManage} onClick={() => toast({ tone: 'info', title: 'Plan changes need the billing API' })}>Change plan</Button></div></Card>
    <Card><SectionHeader title="Usage this month" />
      {([['Conversations (last 30 days)', convs, limit[0]], ['Team seats', seats, limit[1]]] as const).map(([l, v, m]) => <div key={l} className="mb-4 last:mb-0"><div className="mb-1 flex justify-between text-sm"><span className="text-fg2">{l}</span><span className="num font-semibold text-fg">{v} / {m.toLocaleString('en-KE')}</span></div><div className="h-2 overflow-hidden rounded-full bg-sunk"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (v / m) * 100)}%` }} /></div></div>)}</Card>
    <Card><SectionHeader title="Invoices" /><EmptyState compact title="No invoices yet" body="Invoices will be listed here once billing is enabled." /></Card>
  </>)
}
export function SecuritySettings() {
  const { user } = useOrg()
  return (<>
    <Card><SectionHeader title="Security" />
      <DefList items={[['Signed in as', user.email], ['Session', 'This browser · demo session'], ['Two-factor authentication', <Badge>Coming soon</Badge>], ['Single sign-on', <Badge>Coming soon</Badge>], ['Tenant isolation', 'Every request carries the organization ID and is checked server-side']]} /></Card>
    <Card><SectionHeader title="How VEYA protects your data" />
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-fg2"><li>API keys, LLM keys, database credentials and webhook secrets never reach the browser.</li><li>Role-based access is enforced by the API; this interface mirrors it.</li><li>Every change to a lead, conversation, workflow or role is written to the <Link to="/app/settings/audit" className="font-semibold text-accent-ink hover:underline">audit log</Link>.</li><li>Inputs are validated on both client and server, and the API is rate limited.</li></ul></Card>
  </>)
}

export const describeAudit = (a: AuditEntry) => {
  const verb: Record<string, string> = { 'lead.status_changed': `moved ${a.entityLabel}`, 'lead.created': `created ${a.entityLabel}`, 'lead.assigned': `assigned ${a.entityLabel}`, 'lead.updated': `updated ${a.entityLabel}`, 'conversation.assigned': `assigned ${a.entityLabel}`, 'conversation.status': `changed ${a.entityLabel}`, 'conversation.escalated': `escalated ${a.entityLabel}` }
  const base = verb[a.action] ?? `${a.action.split('.')[1]?.replace('_', ' ') ?? a.action} ${a.entityLabel}`
  if (a.action === 'lead.status_changed') return `${base} from ${a.previous} → ${a.next}`
  if (a.previous && a.next) return `${base}: ${a.previous} → ${a.next}`
  if (a.next && a.action.endsWith('assigned')) return `${base} to ${a.next}`
  return a.next ? `${base} (${a.next})` : base
}
export function AuditSettings() {
  const { orgId, role } = useOrg()
  const all = useDb((s) => s.audit), [q, setQ] = useState(''), [type, setType] = useState(''), [page, setPage] = useState(1)
  const dq = useDebounced(q, 200)
  const rows = useMemo(() => all.filter((a) => a.orgId === orgId && (!type || a.entityType === type) && (!dq || `${a.actor.name} ${describeAudit(a)}`.toLowerCase().includes(dq.toLowerCase()))).sort((a, b) => b.at - a.at), [all, orgId, type, dq])
  if (!can(role, 'audit.view')) return <NoPermission what="The audit log" />
  const cols: Column<AuditEntry>[] = [
    { id: 't', header: 'When', cell: (a) => <span className="whitespace-nowrap text-fg2">{dateTime(a.at)}</span> },
    { id: 'a', header: 'Event', cell: (a) => <span><b className="font-semibold">{a.actor.name}</b>{a.actor.kind === 'ai' && <Badge tone="accent" className="ml-1.5">AI</Badge>} {describeAudit(a)}</span> },
    { id: 'e', header: 'Entity', cell: (a) => <span className="capitalize text-fg2">{a.entityType}</span> },
    { id: 'p', header: 'Previous', hideOnCard: true, cell: (a) => <span className="text-fg3">{a.previous ?? '—'}</span> },
    { id: 'n', header: 'New', hideOnCard: true, cell: (a) => <span className="text-fg2">{a.next ?? '—'}</span> },
  ]
  return (
    <Card pad={false}><div className="p-4 pb-3 sm:p-5 sm:pb-3"><SectionHeader title="Audit log" sub="Who changed what, and when" />
      <div className="flex flex-wrap gap-2"><Input aria-label="Search audit log" placeholder="Search events" className="max-w-xs" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <Select aria-label="Entity type" className="w-40" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}><option value="">All entities</option>{['lead', 'conversation', 'customer', 'workflow', 'task', 'agent', 'user'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</Select></div></div>
      <DataTable caption="Audit log" columns={cols} rows={rows.slice((page - 1) * 20, page * 20)} rowKey={(a) => a.id} page={page} pageSize={20} total={rows.length} onPage={setPage} empty={<EmptyState title="No matching events" body="Changes to leads, conversations and workflows will be recorded here." />} /></Card>
  )
}
