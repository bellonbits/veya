import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { Page } from '../../layouts/Page'
import { useDebounced, useOrg, usePermission, useQs, useService } from '../../hooks'
import { getCompany, getContact, listCompanies, listContacts, type CompanyRow, type ContactRow } from '../../services/crm'
import { orgUsers } from '../../services/common'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { Avatar, Card, DefList, LeadBadge, PageHeader, SectionHeader, StatusBadge, Tabs } from '../../components/ui/Display'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Form'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { ActivityTimeline, ChannelTag, Owner } from '../../components/domain/Common'
import { ago, dueLabel, kes } from '../../lib/format'

export function Contacts() {
  const { orgId } = useOrg(), qs = useQs(), setQC = useUi((s) => s.setQuickCreate), canWrite = usePermission('crm.write')
  const [q, setQ] = useState(qs.get('q'))
  const dq = useDebounced(q, 250)
  useEffect(() => { if (dq !== qs.get('q')) qs.set({ q: dq || undefined }) }, [dq]) // eslint-disable-line react-hooks/exhaustive-deps
  const query = { q: qs.get('q'), status: qs.get('status') || undefined, owner: qs.get('owner') || undefined, sort: qs.get('sort', 'lastInteractionAt'), order: qs.get('order', 'desc') as 'asc' | 'desc', page: Number(qs.get('page', '1')) }
  const { data, error, refetch } = useService('contacts', () => listContacts(orgId, query), [JSON.stringify(query)])
  const onSort = (k: string) => qs.set({ sort: k, order: query.sort === k && query.order === 'desc' ? 'asc' : 'desc' })
  const cols: Column<ContactRow>[] = [
    { id: 'name', header: 'Name', sortKey: 'name', cell: (c) => <span className="flex items-center gap-2.5"><Avatar name={c.name} size={28} /><span className="min-w-0"><span className="block truncate font-semibold">{c.name}</span><span className="block truncate text-xs text-fg3">{c.location}</span></span></span> },
    { id: 'company', header: 'Company', sortKey: 'companyName', cell: (c) => c.companyName ?? <span className="text-fg3">—</span> },
    { id: 'email', header: 'Email', cell: (c) => <span className="text-fg2">{c.email || '—'}</span>, hideOnCard: true },
    { id: 'phone', header: 'Phone', cell: (c) => <span className="text-fg2">{c.phone || '—'}</span> },
    { id: 'status', header: 'Status', sortKey: 'status', cell: (c) => <StatusBadge status={c.status} /> },
    { id: 'last', header: 'Last interaction', sortKey: 'lastInteractionAt', cell: (c) => <span className="text-fg2">{ago(c.lastInteractionAt)}</span> },
    { id: 'owner', header: 'Owner', sortKey: 'ownerName', cell: (c) => <Owner id={c.ownerId} name={c.ownerName} /> },
  ]
  return (
    <Page wide>
      <title>Contacts · VEYA CRM</title>
      <PageHeader title="Contacts" sub={data ? `${data.total} people` : 'Everyone your business talks to'} actions={<Button variant="accent" icon={<Plus className="h-4 w-4" />} disabled={!canWrite} onClick={() => setQC('contact')}>New contact</Button>} />
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input className="col-span-2" aria-label="Search contacts" placeholder="Search name, email, phone, company" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Status" value={query.status ?? ''} onChange={(e) => qs.set({ status: e.target.value || undefined })}><option value="">All statuses</option><option value="new">New</option><option value="active">Active</option><option value="inactive">Inactive</option></Select>
        <Select aria-label="Owner" value={query.owner ?? ''} onChange={(e) => qs.set({ owner: e.target.value || undefined })}><option value="">All owners</option>{orgUsers(orgId).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
      </div>
      <Card pad={false}>{error ? <ErrorState error={error} onRetry={refetch} /> : (
        <DataTable caption="Contacts" columns={cols} rows={data?.items ?? []} rowKey={(c) => c.id} rowHref={(c) => `/app/crm/contacts/${c.id}`} loading={!data} sort={query.sort} order={query.order} onSort={onSort} page={data?.page} pageSize={data?.pageSize} total={data?.total} onPage={(p) => qs.set({ page: String(p) })}
          empty={<EmptyState title={query.q || query.status ? 'No contacts match' : 'No contacts yet'} body={query.q || query.status ? 'Try a different search or filter.' : 'Contacts are created automatically when customers message you, or you can add one.'} action={<Button variant="accent" onClick={() => setQC('contact')}>New contact</Button>} />} />)}</Card>
    </Page>
  )
}

export function ContactDetail() {
  const { id = '' } = useParams(), { orgId } = useOrg()
  const { data: d, error, refetch } = useService(`contact-${id}`, () => getContact(orgId, id), [id])
  const [tab, setTab] = useState('overview'), [note, setNote] = useState('')
  const db = useDb.getState(), canWrite = usePermission('crm.write')
  const back = <Link to="/app/crm/contacts" className="mb-3 inline-flex items-center gap-1.5 text-sm text-fg2 hover:text-fg"><ArrowLeft className="h-4 w-4" />Contacts</Link>
  if (error) return <Page><ErrorState error={error} onRetry={refetch} back={{ to: '/app/crm/contacts', label: 'Back to contacts' }} /></Page>
  if (!d) return <Page><LoadingState rows={6} label="Loading contact" /></Page>
  const c = d.customer
  return (
    <Page>
      <title>{`${c.name} · VEYA CRM`}</title>
      <PageHeader back={back} title={<span className="flex items-center gap-3"><Avatar name={c.name} size={44} />{c.name}</span>} sub={<>{c.location} · <StatusBadge status={c.status} /></>}
        tabs={<Tabs label="Contact sections" active={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'conversations', label: 'Conversations', count: d.conversations.length }, { id: 'leads', label: 'Leads', count: d.leads.length }, { id: 'tasks', label: 'Tasks', count: d.tasks.length }, { id: 'notes', label: 'Notes', count: d.notes.length }, { id: 'activity', label: 'Activity' }]} />} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {tab === 'overview' && <><Card><SectionHeader title="Identity" /><DefList items={[['Phone', c.phone], ['Email', c.email], ['Location', c.location], ['Owner', <Owner id={c.ownerId} />], ['Tags', c.tags.join(', ')], ...Object.entries(c.custom).map(([k, v]) => [k, v] as [string, string])]} /></Card>
            <Card><SectionHeader title="Recent activity" /><ActivityTimeline items={d.activities} limit={6} /></Card></>}
          {tab === 'conversations' && <Card pad={false}>{d.conversations.length === 0 ? <EmptyState compact title="No conversations" body="Conversations with this contact will appear here." /> : <ul className="divide-y divide-edge">{d.conversations.map((v) => <li key={v.id}><Link to={`/app/inbox/${v.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-sunk"><span className="flex items-center gap-3"><ChannelTag channel={v.channel} /><StatusBadge status={v.status} /></span><span className="text-xs text-fg3">{ago(v.lastMessageAt)}</span></Link></li>)}</ul>}</Card>}
          {tab === 'leads' && <Card pad={false}>{d.leads.length === 0 ? <EmptyState compact title="No leads" body="Leads created from this contact will appear here." /> : <ul className="divide-y divide-edge">{d.leads.map((l) => <li key={l.id}><Link to={`/app/crm/leads/${l.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-sunk"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-fg">#{l.number} · {l.title}</span><span className="text-xs text-fg3">{kes(l.value)} · {ago(l.createdAt)}</span></span><LeadBadge status={l.status} /></Link></li>)}</ul>}</Card>}
          {tab === 'tasks' && <Card pad={false}>{d.tasks.length === 0 ? <EmptyState compact title="No tasks" body="Tasks related to this contact will appear here." /> : <ul className="divide-y divide-edge">{d.tasks.map((t) => <li key={t.id} className="flex items-start gap-3 px-4 py-3 text-sm"><input type="checkbox" checked={t.status === 'done'} disabled={!canWrite} onChange={() => db.toggleTask(t.id)} aria-label={`Mark done: ${t.title}`} className="mt-1 h-4 w-4 accent-[var(--c-accent)]" /><span><span className={t.status === 'done' ? 'text-fg3 line-through' : 'text-fg'}>{t.title}</span><span className="block text-xs text-fg3">{dueLabel(t.dueAt)}</span></span></li>)}</ul>}</Card>}
          {tab === 'notes' && <Card>{canWrite && <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) { db.addNote({ customerId: c.id }, note.trim()); setNote('') } }}><Input aria-label="Add a note" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} /><Button type="submit" disabled={!note.trim()}>Add note</Button></form>}
            {d.notes.length === 0 ? <p className="text-sm text-fg3">No notes yet.</p> : <ActivityTimeline items={d.notes} />}</Card>}
          {tab === 'activity' && <Card><ActivityTimeline items={d.activities} limit={30} /></Card>}
        </div>
        <div className="space-y-4">
          {d.company && <Card><SectionHeader title="Company" /><Link to={`/app/crm/companies/${d.company.id}`} className="block hover:text-accent-ink"><p className="text-sm font-semibold text-fg">{d.company.name}</p><p className="text-xs text-fg3">{d.company.industry} · {d.company.location}</p></Link></Card>}
          <Card><SectionHeader title="Open leads" />{d.leads.filter((l) => l.status !== 'won' && l.status !== 'lost').length === 0 ? <p className="text-sm text-fg3">None open.</p> : <ul className="space-y-2">{d.leads.filter((l) => l.status !== 'won' && l.status !== 'lost').map((l) => <li key={l.id} className="flex items-center justify-between text-sm"><Link className="truncate hover:text-accent-ink" to={`/app/crm/leads/${l.id}`}>#{l.number}</Link><span className="num font-semibold">{kes(l.value)}</span></li>)}</ul>}</Card>
        </div>
      </div>
    </Page>
  )
}

export function Companies() {
  const { orgId } = useOrg(), qs = useQs()
  const [q, setQ] = useState(qs.get('q'))
  const dq = useDebounced(q, 250)
  const { data, error, refetch } = useService('companies', () => listCompanies(orgId, { q: dq, sort: qs.get('sort', 'totalValue'), order: qs.get('order', 'desc') as 'asc' | 'desc' }), [dq, qs.get('sort'), qs.get('order')])
  const sort = qs.get('sort', 'totalValue'), order = qs.get('order', 'desc') as 'asc' | 'desc'
  const cols: Column<CompanyRow>[] = [
    { id: 'name', header: 'Company', sortKey: 'name', cell: (c) => <div className="min-w-0"><p className="truncate font-semibold">{c.name}</p><p className="truncate text-xs text-fg3">{c.website}</p></div> },
    { id: 'industry', header: 'Industry', sortKey: 'industry', cell: (c) => c.industry },
    { id: 'loc', header: 'Location', cell: (c) => <span className="text-fg2">{c.location}</span> },
    { id: 'contacts', header: 'Contacts', sortKey: 'contacts', cell: (c) => <span className="num">{c.contacts}</span> },
    { id: 'open', header: 'Open opportunities', sortKey: 'openOpportunities', cell: (c) => <span className="num">{c.openOpportunities}</span> },
    { id: 'value', header: 'Total value', sortKey: 'totalValue', align: 'right', cell: (c) => <span className="num font-semibold">{kes(c.totalValue)}</span> },
    { id: 'last', header: 'Recent activity', sortKey: 'lastActivity', cell: (c) => <span className="text-fg2">{c.lastActivity ? ago(c.lastActivity) : '—'}</span> },
  ]
  return (
    <Page wide>
      <title>Companies · VEYA CRM</title>
      <PageHeader title="Companies" sub={data ? `${data.total} companies` : 'Organizations behind your contacts'} />
      <div className="mb-3 max-w-sm"><Input aria-label="Search companies" placeholder="Search companies" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Card pad={false}>{error ? <ErrorState error={error} onRetry={refetch} /> : (
        <DataTable caption="Companies" columns={cols} rows={data?.items ?? []} rowKey={(c) => c.id} rowHref={(c) => `/app/crm/companies/${c.id}`} loading={!data} sort={sort} order={order} onSort={(k) => qs.set({ sort: k, order: sort === k && order === 'desc' ? 'asc' : 'desc' })}
          empty={<EmptyState title="No companies yet" body="Companies appear when you link contacts to an organization." />} />)}</Card>
    </Page>
  )
}

export function CompanyDetail() {
  const { id = '' } = useParams(), { orgId } = useOrg()
  const { data: d, error, refetch } = useService(`company-${id}`, () => getCompany(orgId, id), [id])
  const back = <Link to="/app/crm/companies" className="mb-3 inline-flex items-center gap-1.5 text-sm text-fg2 hover:text-fg"><ArrowLeft className="h-4 w-4" />Companies</Link>
  if (error) return <Page><ErrorState error={error} onRetry={refetch} back={{ to: '/app/crm/companies', label: 'Back to companies' }} /></Page>
  if (!d) return <Page><LoadingState rows={5} label="Loading company" /></Page>
  const open = d.leads.filter((l) => l.status !== 'won' && l.status !== 'lost')
  return (
    <Page>
      <title>{`${d.company.name} · VEYA CRM`}</title>
      <PageHeader back={back} title={d.company.name} sub={`${d.company.industry} · ${d.company.location} · ${d.company.website}`} />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card pad={false}><div className="p-5 pb-0"><SectionHeader title={`Opportunities (${d.leads.length})`} sub={`${open.length} open · ${kes(open.reduce((a, l) => a + l.value, 0))}`} /></div>
            {d.leads.length === 0 ? <EmptyState compact title="No opportunities" body="Leads linked to this company will appear here." /> : <ul className="divide-y divide-edge">{d.leads.map((l) => <li key={l.id}><Link to={`/app/crm/leads/${l.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-sunk"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-fg">#{l.number} · {l.title}</span><span className="text-xs text-fg3">{kes(l.value)} · {ago(l.lastActivityAt)}</span></span><LeadBadge status={l.status} /></Link></li>)}</ul>}</Card>
          <Card><SectionHeader title="Recent activity" />{d.activities.length ? <ActivityTimeline items={d.activities} limit={8} /> : <p className="text-sm text-fg3">No recent activity.</p>}</Card>
        </div>
        <Card><SectionHeader title={`Contacts (${d.contacts.length})`} />{d.contacts.length === 0 ? <p className="text-sm text-fg3">No contacts linked.</p> : <ul className="space-y-1">{d.contacts.map((c) => <li key={c.id}><Link to={`/app/crm/contacts/${c.id}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-sunk"><Avatar name={c.name} size={28} /><span className="text-sm font-medium text-fg">{c.name}</span></Link></li>)}</ul>}</Card>
      </div>
    </Page>
  )
}
