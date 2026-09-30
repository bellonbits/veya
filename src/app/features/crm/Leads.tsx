import { Link } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { Page } from '../../layouts/Page'
import { useDebounced, useOrg, usePermission, useQs, useService } from '../../hooks'
import { listLeads, type LeadRow } from '../../services/crm'
import { orgUsers } from '../../services/common'
import { Card, LeadBadge, PageHeader, Segmented, Badge } from '../../components/ui/Display'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Form'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { EmptyState, ErrorState } from '../../components/ui/States'
import { Owner } from '../../components/domain/Common'
import { ago, kes, shortDate } from '../../lib/format'
import { STATUS_ORDER } from '../../types'
import { useUi } from '../../store/ui'
import { useEffect, useState } from 'react'

const SOURCES = ['WhatsApp', 'Website', 'Referral', 'Facebook Ads', 'Email', 'Walk-in']

export default function Leads() {
  const { orgId } = useOrg(), qs = useQs(), setQC = useUi((s) => s.setQuickCreate), canWrite = usePermission('crm.write')
  const [q, setQ] = useState(qs.get('q'))
  const dq = useDebounced(q, 250)
  useEffect(() => { if (dq !== qs.get('q')) qs.set({ q: dq || undefined }) }, [dq]) // eslint-disable-line react-hooks/exhaustive-deps
  const query = { q: qs.get('q'), status: qs.get('status'), owner: qs.get('owner'), source: qs.get('source'), from: qs.get('from'), to: qs.get('to'), minValue: qs.get('minValue'), sort: qs.get('sort', 'createdAt'), order: qs.get('order', 'desc') as 'asc' | 'desc', page: Number(qs.get('page', '1')) }
  const { data, error, refetch } = useService('leads', () => listLeads(orgId, { ...query, status: query.status || undefined, owner: query.owner || undefined, source: query.source || undefined, from: query.from || undefined, to: query.to || undefined, minValue: query.minValue || undefined }), [JSON.stringify(query)])
  const onSort = (k: string) => qs.set({ sort: k, order: query.sort === k && query.order === 'desc' ? 'asc' : 'desc' })
  const filtered = !!(query.q || query.status || query.owner || query.source || query.from || query.minValue)
  const cols: Column<LeadRow>[] = [
    { id: 'name', header: 'Lead', sortKey: 'customerName', cell: (l) => <div className="min-w-0"><p className="truncate font-semibold">{l.customerName}</p><p className="truncate text-xs text-fg3">#{l.number} · {l.title}</p></div> },
    { id: 'company', header: 'Company', cell: (l) => l.companyName ?? <span className="text-fg3">—</span> },
    { id: 'source', header: 'Source', sortKey: 'source', cell: (l) => l.source },
    { id: 'owner', header: 'Owner', sortKey: 'ownerName', cell: (l) => <Owner id={l.ownerId} name={l.ownerName} /> },
    { id: 'status', header: 'Status', sortKey: 'status', cell: (l) => <LeadBadge status={l.status} /> },
    { id: 'value', header: 'Value', sortKey: 'value', align: 'right', cell: (l) => <span className="num font-semibold">{kes(l.value)}</span> },
    { id: 'created', header: 'Created', sortKey: 'createdAt', cell: (l) => <span className="text-fg2">{shortDate(l.createdAt)}</span> },
    { id: 'last', header: 'Last activity', sortKey: 'lastActivityAt', cell: (l) => <span className="text-fg2">{ago(l.lastActivityAt)}</span> },
    { id: 'next', header: 'Next action', hideOnCard: true, cell: (l) => <span className="text-fg2">{l.nextAction}</span> },
  ]
  return (
    <Page wide>
      <title>Leads · VEYA CRM</title>
      <PageHeader title="Leads" sub={data ? `${data.total} lead${data.total === 1 ? '' : 's'}${filtered ? ' match your filters' : ''}` : 'Every opportunity across all channels'}
        actions={<><Link to="/app/crm/pipeline" className="text-sm font-semibold text-accent-ink hover:underline">Pipeline view</Link><Button variant="accent" icon={<Plus className="h-4 w-4" />} disabled={!canWrite} onClick={() => setQC('lead')}>New lead</Button></>} />
      <div className="mb-3 overflow-x-auto"><Segmented label="Lead status" value={query.status || 'all'} onChange={(v) => qs.set({ status: v === 'all' ? undefined : v })}
        options={[{ id: 'all', label: 'All', count: data ? Object.values(data.facets).reduce((a, b) => a + b, 0) : undefined }, ...STATUS_ORDER.map((s) => ({ id: s, label: s[0].toUpperCase() + s.slice(1), count: data?.facets[s] ?? 0 }))]} /></div>
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Input className="col-span-2 lg:col-span-2" aria-label="Search leads" placeholder="Search name, company, #number" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Owner" value={query.owner} onChange={(e) => qs.set({ owner: e.target.value || undefined })}><option value="">All owners</option><option value="none">Unassigned</option>{orgUsers(orgId).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
        <Select aria-label="Source" value={query.source} onChange={(e) => qs.set({ source: e.target.value || undefined })}><option value="">All sources</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</Select>
        <Select aria-label="Minimum value" value={query.minValue} onChange={(e) => qs.set({ minValue: e.target.value || undefined })}><option value="">Any value</option><option value="500000">≥ KES 500K</option><option value="1000000">≥ KES 1M</option><option value="5000000">≥ KES 5M</option></Select>
        <Select aria-label="Created" value={query.from ? 'custom' : ''} onChange={(e) => { const d = Number(e.target.value); qs.set(d ? { from: new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10), to: undefined } : { from: undefined, to: undefined }) }}>
          <option value="">Any date</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>{query.from && <option value="custom">{query.from} → {query.to || 'now'}</option>}</Select>
      </div>
      {(query.from || query.to) && <p className="mb-3 flex items-center gap-2 text-sm text-fg2">Created between <Badge tone="accent">{query.from || 'start'} → {query.to || 'today'}</Badge><button type="button" className="inline-flex items-center gap-1 text-accent-ink hover:underline" onClick={() => qs.set({ from: undefined, to: undefined })}><X className="h-3 w-3" />clear</button></p>}
      <Card pad={false}>
        {error ? <ErrorState error={error} onRetry={refetch} /> : (
          <DataTable caption="Leads" columns={cols} rows={data?.items ?? []} rowKey={(l) => l.id} rowHref={(l) => `/app/crm/leads/${l.id}`} loading={!data}
            sort={query.sort} order={query.order} onSort={onSort} page={data?.page} pageSize={data?.pageSize} total={data?.total} onPage={(p) => qs.set({ page: String(p) })}
            empty={filtered ? <EmptyState title="No leads match these filters" body="Try widening the date range or clearing a filter." action={<Button onClick={() => { setQ(''); qs.set({ q: undefined, status: undefined, owner: undefined, source: undefined, from: undefined, to: undefined, minValue: undefined }) }}>Clear filters</Button>} />
              : <EmptyState title="No leads yet" body="Your leads will appear here when customers begin interacting with your business." action={<Button variant="accent" onClick={() => setQC('lead')}>Create lead</Button>} />} />
        )}
      </Card>
    </Page>
  )
}
