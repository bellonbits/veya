import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Pause, Pencil, Play, Plus, Trash2, Workflow as WorkflowIcon } from 'lucide-react'
import { Page } from '../../layouts/Page'
import { useOrg, usePermission, useQs, useService } from '../../hooks'
import { getRun, getWorkflow, listRuns, listWorkflows, type RunRow, type WorkflowRow } from '../../services/flows'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { TEMPLATES } from '../../data/workflows'
import { Badge, Card, MetricCard, PageHeader, SectionHeader, Segmented, StatusBadge } from '../../components/ui/Display'
import { Button, LinkButton } from '../../components/ui/Button'
import { Select } from '../../components/ui/Form'
import { ConfirmDialog, Dropdown } from '../../components/ui/Overlay'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { EmptyState, ErrorState, LoadingState, NoPermission } from '../../components/ui/States'
import { WorkflowCanvasView } from '../../components/domain/WorkflowCanvas'
import { ago, cap, dateTime, duration, pct } from '../../lib/format'

function useGuard() { return usePermission('flows.manage') }

export function FlowsList() {
  const { orgId } = useOrg(), nav = useNavigate(), can = useGuard(), toast = useUi((s) => s.toast), setQC = useUi((s) => s.setQuickCreate)
  const { data, error, refetch } = useService('workflows', () => listWorkflows(orgId))
  const [del, setDel] = useState<WorkflowRow | null>(null)
  if (!can) return <Page><NoPermission what="VEYA Flow" /></Page>
  const cols: Column<WorkflowRow>[] = [
    { id: 'name', header: 'Workflow', cell: (w) => <div className="min-w-0"><p className="truncate font-semibold">{w.name}</p><p className="truncate text-xs text-fg3">{w.description}</p></div> },
    { id: 'status', header: 'Status', cell: (w) => <StatusBadge status={w.status} /> },
    { id: 'trigger', header: 'Trigger', cell: (w) => <span className="text-fg2">{w.trigger}</span> },
    { id: 'runs', header: 'Runs', align: 'right', cell: (w) => <Link to={`/app/flows/runs?workflow=${w.id}`} className="num text-accent-ink hover:underline" onClick={(e) => e.stopPropagation()}>{w.runs}</Link> },
    { id: 'rate', header: 'Success rate', align: 'right', cell: (w) => <span className="num font-semibold">{w.successRate === null ? '—' : pct(w.successRate)}</span> },
    { id: 'last', header: 'Last run', cell: (w) => <span className="text-fg2">{w.lastRun ? ago(w.lastRun) : 'Never'}</span> },
    { id: 'upd', header: 'Updated', cell: (w) => <span className="text-fg2">{ago(w.updatedAt)}</span> },
    { id: 'more', header: '', align: 'right', hideOnCard: true, cell: (w) => (
      <span onClick={(e) => e.stopPropagation()}><Dropdown label={`Actions for ${w.name}`} trigger={<span className="rounded-lg px-2 py-1 text-fg3 hover:bg-sunk">•••</span>} items={[
        { label: 'Open builder', icon: <Pencil className="h-4 w-4" />, onSelect: () => nav(`/app/flows/${w.id}/builder`) },
        { label: w.status === 'active' ? 'Pause' : 'Activate', icon: w.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />, onSelect: () => useDb.getState().updateWorkflow(w.id, { status: w.status === 'active' ? 'paused' : 'active' }) },
        { label: 'Duplicate', icon: <Copy className="h-4 w-4" />, onSelect: () => { useDb.getState().createWorkflow({ name: `${w.name} (copy)`, description: w.description, nodes: w.nodes, edges: w.edges }); toast({ tone: 'success', title: 'Workflow duplicated as draft' }) } },
        'sep', { label: 'Delete', danger: true, icon: <Trash2 className="h-4 w-4" />, onSelect: () => setDel(w) },
      ]} /></span>) },
  ]
  return (
    <Page wide>
      <title>Flows · VEYA</title>
      <PageHeader title="VEYA Flow" sub="Automate repetitive processes across conversations, leads and tasks" actions={<><LinkButton to="/app/flows/templates">Templates</LinkButton><LinkButton to="/app/flows/runs">All runs</LinkButton><Button variant="accent" icon={<Plus className="h-4 w-4" />} onClick={() => setQC('workflow')}>New workflow</Button></>} />
      <Card pad={false}>{error ? <ErrorState error={error} onRetry={refetch} /> : (
        <DataTable caption="Workflows" columns={cols} rows={data ?? []} rowKey={(w) => w.id} rowHref={(w) => `/app/flows/${w.id}`} loading={!data}
          empty={<EmptyState icon={<WorkflowIcon className="h-5 w-5" />} title="Automate your first process" body="Workflows run when something happens — a new lead, a status change, a schedule — and do the repetitive work for your team." action={<div className="flex gap-2"><Button variant="accent" onClick={() => setQC('workflow')}>Create workflow</Button><LinkButton to="/app/flows/templates">Browse templates</LinkButton></div>} />} />)}</Card>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} danger title={`Delete “${del?.name}”?`} description="Its run history stays in the audit log, but the workflow will stop running." confirmLabel="Delete workflow" onConfirm={() => { if (del) { useDb.getState().deleteWorkflow(del.id); toast({ tone: 'success', title: 'Workflow deleted' }) } }} />
    </Page>
  )
}

export function Templates() {
  const nav = useNavigate(), can = useGuard(), toast = useUi((s) => s.toast)
  if (!can) return <Page><NoPermission what="Workflow templates" /></Page>
  return (
    <Page>
      <title>Templates · VEYA Flow</title>
      <PageHeader title="Workflow templates" sub="Start from a proven flow and adjust it in the builder" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => { const d = t.build(); return (
          <Card key={t.id} className="flex flex-col">
            <Badge className="self-start">{t.category}</Badge>
            <h2 className="mt-3 text-base font-semibold text-fg">{t.name}</h2><p className="mt-1 flex-1 text-sm text-fg2">{t.description}</p>
            <p className="mt-3 text-xs text-fg3">{d.nodes.length - d.nodes.filter((n) => n.type === 'end').length} steps · trigger: {d.nodes[0].data.label}</p>
            <Button className="mt-3" variant="accent" onClick={() => { const w = useDb.getState().createWorkflow({ name: t.name, description: t.description, ...d }); toast({ tone: 'success', title: 'Draft created from template' }); nav(`/app/flows/${w.id}/builder`) }}>Use template</Button>
          </Card>) })}
      </div>
    </Page>
  )
}

export function WorkflowDetail() {
  const { id = '' } = useParams(), { orgId } = useOrg(), can = useGuard(), nav = useNavigate(), toast = useUi((s) => s.toast)
  const { data: w, error, refetch } = useService(`wf-${id}`, () => getWorkflow(orgId, id), [id])
  const back = <Link to="/app/flows" className="mb-3 inline-flex items-center gap-1.5 text-sm text-fg2 hover:text-fg"><ArrowLeft className="h-4 w-4" />Flows</Link>
  if (!can) return <Page><NoPermission what="VEYA Flow" /></Page>
  if (error) return <Page><ErrorState error={error} onRetry={refetch} back={{ to: '/app/flows', label: 'Back to workflows' }} /></Page>
  if (!w) return <Page><LoadingState rows={5} label="Loading workflow" /></Page>
  const latest = () => useDb.getState().leads.filter((l) => l.orgId === orgId).sort((a, b) => b.createdAt - a.createdAt)[0]
  return (
    <Page>
      <title>{`${w.name} · VEYA Flow`}</title>
      <PageHeader back={back} title={<span className="flex flex-wrap items-center gap-3">{w.name}<StatusBadge status={w.status} /></span>} sub={w.description}
        actions={<><Button icon={<Play className="h-4 w-4" />} disabled={w.status === 'draft'} title={w.status === 'draft' ? 'Activate the workflow first' : undefined} onClick={() => { const l = latest(); const r = useDb.getState().triggerWorkflow(w.id, { leadId: l?.id, customerId: l?.customerId }); if (r) toast({ tone: r.status === 'failed' ? 'error' : 'success', title: `Run ${r.status}`, href: `/app/flows/runs/${r.id}`, action: 'View run' }) }}>Run on latest lead</Button>
          <LinkButton to={`/app/flows/runs?workflow=${w.id}`}>View runs</LinkButton><Button variant="accent" icon={<Pencil className="h-4 w-4" />} onClick={() => nav(`/app/flows/${w.id}/builder`)}>Open builder</Button></>} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Total runs" value={String(w.runs)} href={`/app/flows/runs?workflow=${w.id}`} /><MetricCard label="Success rate" value={w.successRate === null ? '—' : pct(w.successRate)} hint={`${w.failed} failed`} href={`/app/flows/runs?workflow=${w.id}&status=failed`} />
        <MetricCard label="Avg. duration" value={w.avgDurationMs ? duration(w.avgDurationMs) : '—'} /><MetricCard label="Last run" value={w.lastRun ? ago(w.lastRun) : 'Never'} />
      </div>
      <WorkflowCanvasView nodes={w.nodes} edges={w.edges} height={460} />
      <Card className="mt-4" pad={false}><div className="p-5 pb-2"><SectionHeader title="Recent runs" action={<Link className="text-xs font-semibold text-accent-ink hover:underline" to={`/app/flows/runs?workflow=${w.id}`}>All runs</Link>} /></div>
        {w.recentRuns.length === 0 ? <EmptyState compact title="No runs yet" body="Runs appear here when the trigger fires." /> : <ul className="divide-y divide-edge">{w.recentRuns.map((r) => <li key={r.id}><Link to={`/app/flows/runs/${r.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-sunk"><span className="text-fg">{dateTime(r.startedAt)} <span className="text-fg3">· {r.triggeredBy}</span></span><StatusBadge status={r.status} /></Link></li>)}</ul>}</Card>
    </Page>
  )
}

export function Runs() {
  const { orgId } = useOrg(), qs = useQs(), can = useGuard()
  const status = qs.get('status'), workflow = qs.get('workflow'), page = Number(qs.get('page', '1'))
  const { data, error, refetch } = useService('runs', () => listRuns(orgId, { status: status || undefined, workflow: workflow || undefined, page }), [status, workflow, page])
  const wfs = useService('runs-wfs', () => listWorkflows(orgId))
  if (!can) return <Page><NoPermission what="Workflow runs" /></Page>
  const cols: Column<RunRow>[] = [
    { id: 'wf', header: 'Workflow', cell: (r) => <div className="min-w-0"><p className="truncate font-semibold">{r.workflowName}</p><p className="truncate text-xs text-fg3">{r.triggeredBy}{r.customerName ? ` · ${r.customerName}` : ''}</p></div> },
    { id: 'started', header: 'Started', cell: (r) => <span className="text-fg2">{dateTime(r.startedAt)}</span> },
    { id: 'completed', header: 'Completed', cell: (r) => <span className="text-fg2">{r.completedAt ? dateTime(r.completedAt) : '—'}</span>, hideOnCard: true },
    { id: 'dur', header: 'Duration', align: 'right', cell: (r) => <span className="num">{r.completedAt ? duration(r.completedAt - r.startedAt) : '—'}</span> },
    { id: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} /> },
  ]
  return (
    <Page wide>
      <title>Runs · VEYA Flow</title>
      <PageHeader title="Workflow runs" sub="Every execution is recorded with inputs, outputs and errors" />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Segmented label="Run status" value={status || 'all'} onChange={(v) => qs.set({ status: v === 'all' ? undefined : v })} options={[{ id: 'all', label: 'All', count: data?.counts.all }, ...(['completed', 'running', 'waiting', 'failed'] as const).map((s) => ({ id: s, label: cap(s), count: data?.counts[s] ?? 0 }))]} />
        <Select aria-label="Workflow" className="w-56" value={workflow} onChange={(e) => qs.set({ workflow: e.target.value || undefined })}><option value="">All workflows</option>{wfs.data?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>
      </div>
      <Card pad={false}>{error ? <ErrorState error={error} onRetry={refetch} /> : (
        <DataTable caption="Workflow runs" columns={cols} rows={data?.items ?? []} rowKey={(r) => r.id} rowHref={(r) => `/app/flows/runs/${r.id}`} loading={!data} page={data?.page} pageSize={data?.pageSize} total={data?.total} onPage={(p) => qs.set({ page: String(p) })}
          empty={<EmptyState title="No runs match" body="Runs appear here as your workflows execute." />} />)}</Card>
    </Page>
  )
}

const pretty = (v: unknown) => JSON.stringify(v, null, 2)
export function RunDetail() {
  const { id = '' } = useParams(), { orgId } = useOrg(), can = useGuard()
  const { data: r, error, refetch } = useService(`run-${id}`, () => getRun(orgId, id), [id])
  const status = useMemo(() => Object.fromEntries((r?.steps ?? []).map((s) => [s.nodeId, s.status])), [r])
  const back = <Link to="/app/flows/runs" className="mb-3 inline-flex items-center gap-1.5 text-sm text-fg2 hover:text-fg"><ArrowLeft className="h-4 w-4" />Runs</Link>
  if (!can) return <Page><NoPermission what="Workflow runs" /></Page>
  if (error) return <Page><ErrorState error={error} onRetry={refetch} back={{ to: '/app/flows/runs', label: 'Back to runs' }} /></Page>
  if (!r) return <Page><LoadingState rows={5} label="Loading run" /></Page>
  return (
    <Page>
      <title>{`Run · ${r.workflowName}`}</title>
      <PageHeader back={back} title={<span className="flex flex-wrap items-center gap-3">{r.workflowName}<StatusBadge status={r.status} /></span>} sub={`Started ${dateTime(r.startedAt)}${r.completedAt ? ` · ${duration(r.completedAt - r.startedAt)}` : ''} · triggered by ${r.triggeredBy}`}
        actions={<>{r.workflow && <LinkButton to={`/app/flows/${r.workflowId}`}>View workflow</LinkButton>}{r.leadId && <LinkButton to={`/app/crm/leads/${r.leadId}`}>Lead{r.leadNumber ? ` #${r.leadNumber}` : ''}</LinkButton>}{r.conversationId && <LinkButton to={`/app/inbox/${r.conversationId}`}>Conversation</LinkButton>}</>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card><SectionHeader title="Execution" sub={`${r.steps.length} steps recorded`} />
          <ol className="space-y-2">
            <li className="rounded-lg bg-sunk px-3 py-2 text-sm"><span className="font-semibold text-fg">Trigger</span> <span className="text-fg2">· {r.triggeredBy}</span></li>
            {r.steps.map((s, i) => (
              <li key={i} className="rounded-lg border border-edge p-3">
                <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-fg"><span className="num mr-2 text-fg3">{i + 1}</span>{s.label}</p><span className="flex items-center gap-2"><span className="num text-xs text-fg3">{s.durationMs ? duration(s.durationMs) : ''}</span><StatusBadge status={s.status} /></span></div>
                {s.error && <p role="alert" className="mt-2 rounded-md bg-bad-soft px-2.5 py-1.5 text-[13px] text-bad">{s.error}</p>}
                {(s.input !== undefined || s.output !== undefined) && (
                  <details className="mt-2 text-xs"><summary className="cursor-pointer font-semibold text-accent-ink">Input &amp; output</summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">{s.input !== undefined && <div><p className="mb-1 font-semibold text-fg3">Input</p><pre className="scroll-thin max-h-40 overflow-auto rounded-md bg-sunk p-2 text-fg2">{pretty(s.input)}</pre></div>}{s.output !== undefined && <div><p className="mb-1 font-semibold text-fg3">Output</p><pre className="scroll-thin max-h-40 overflow-auto rounded-md bg-sunk p-2 text-fg2">{pretty(s.output)}</pre></div>}</div></details>)}
              </li>))}
          </ol>
        </Card>
        {r.workflow ? <div><p className="mb-2 text-sm font-semibold text-fg">Path taken</p><WorkflowCanvasView nodes={r.workflow.nodes} edges={r.workflow.edges} status={status} height={520} /></div> : <Card><p className="text-sm text-fg3">This workflow has been deleted, so the diagram is unavailable.</p></Card>}
      </div>
    </Page>
  )
}
