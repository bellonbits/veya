import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Page } from '../../layouts/Page'
import { useOrg, usePermission, useService } from '../../hooks'
import { getAiAnalytics, getAutomation, getCustomers, getOverview, getSales, type Metric } from '../../services/analytics'
import { useUi } from '../../store/ui'
import { MetricCard, PageHeader, Segmented, StatusBadge, Tabs } from '../../components/ui/Display'
import { Input } from '../../components/ui/Form'
import { CardsSkeleton, ErrorState, NoPermission, PartialNotice } from '../../components/ui/States'
import { ChartCard, Donut, Funnel, HBars, TimeChart } from '../../components/charts/Charts'
import { Skeleton } from '../../components/ui/Display'
import { duration, kes, pct, secLabel, shortDate } from '../../lib/format'
import type { DateRange } from '../../types'

const TABS = [['overview', 'Overview', '/app/analytics'], ['sales', 'Sales', '/app/analytics/sales'], ['customers', 'Customers', '/app/analytics/customers'], ['automation', 'Automation', '/app/analytics/automation'], ['ai', 'AI', '/app/analytics/ai']] as const

function RangePicker() {
  const range = useUi((s) => s.range), setRange = useUi((s) => s.setRange)
  const [from, setFrom] = useState(''), [to, setTo] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented<DateRange['preset']> label="Date range" value={range.preset} onChange={(v) => (v === 'custom' ? setRange('custom', from && to ? { from, to } : undefined) : setRange(v))}
        options={[{ id: 'today', label: 'Today' }, { id: '7d', label: '7 days' }, { id: '30d', label: '30 days' }, { id: '90d', label: '90 days' }, { id: 'custom', label: 'Custom' }]} />
      {range.preset === 'custom' && (
        <span className="flex items-center gap-1.5"><Input type="date" aria-label="From date" className="w-36" max={today} value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value && to) setRange('custom', { from: e.target.value, to }) }} />
          <span className="text-fg3">–</span><Input type="date" aria-label="To date" className="w-36" max={today} value={to} onChange={(e) => { setTo(e.target.value); if (from && e.target.value) setRange('custom', { from, to: e.target.value }) }} /></span>)}
    </div>
  )
}

function Frame<T extends { range: DateRange; partial: boolean; metrics: Metric[] }>({ title, sub, tab, load, cols = 'xl:grid-cols-6', children, ns }: { title: string; sub: string; tab: string; load: (orgId: string, r: DateRange) => Promise<T>; cols?: string; children: (d: T) => ReactNode; ns: string }) {
  const { orgId } = useOrg(), range = useUi((s) => s.range), can = usePermission('analytics.view')
  const { data, error, refetch } = useService(`an-${ns}`, () => load(orgId, range), [range.from, range.to])
  if (!can) return <Page><NoPermission what="Analytics" /></Page>
  return (
    <Page wide>
      <title>{`${title} · VEYA Analytics`}</title>
      <PageHeader title="Analytics" sub={<>{sub} <span className="font-medium text-fg">{range.label}</span> <span className="text-fg3">· {shortDate(range.from)} – {shortDate(range.to - 1)}</span></>} actions={<RangePicker />}
        tabs={<Tabs label="Analytics sections" active={tab} tabs={TABS.map(([id, label, to]) => ({ id, label, to }))} />} />
      {error ? <ErrorState error={error} onRetry={refetch} /> : !data ? <><CardsSkeleton count={6} /><Skeleton className="mt-4 h-64" /></> : (
        <>
          {data.partial && <PartialNotice>Your data starts later than the start of this range, so earlier periods show zero. Comparisons use the same length of time just before the range.</PartialNotice>}
          <div className={`grid grid-cols-2 gap-3 lg:grid-cols-3 ${cols}`}>
            {data.metrics.map((m) => <MetricCard key={m.key} label={m.label} value={m.display} delta={m.delta} hint={m.hint} href={m.href} invert={m.invertDelta} unit={/rate|conversion/i.test(m.label) && m.delta !== null ? ' pts' : '%'} />)}
          </div>
          <div className="mt-4">{children(data)}</div>
          <p className="mt-6 text-xs text-fg3">Computed from platform events and records for {range.label.toLowerCase()}. Select any metric to see the records behind it.</p>
        </>
      )}
    </Page>
  )
}
const grid = 'grid gap-4 lg:grid-cols-2'

export function AnalyticsOverview() {
  return <Frame ns="overview" tab="overview" title="Overview" sub="How your business is performing over" load={getOverview}>{(d) => (
    <div className={grid}>
      <ChartCard title="Lead volume over time" sub="New and qualified leads"><TimeChart title="Lead volume over time" kind="area" data={d.leadSeries} series={[{ key: 'leads', label: 'New leads' }, { key: 'qualified', label: 'Qualified', color: 2 }]} /></ChartCard>
      <ChartCard title="Lead sources" sub="Where leads in this range came from"><Donut title="Lead sources" data={d.sources} sub="leads" /></ChartCard>
      <ChartCard title="Conversion funnel" sub="Leads created in range that reached each stage"><Funnel data={d.funnel} /></ChartCard>
      <ChartCard title="Response time" sub="Average first reply, in seconds"><TimeChart title="Response time" kind="line" format={secLabel} data={d.responseSeries} series={[{ key: 'ai', label: 'AI' }, { key: 'human', label: 'Human', color: 2 }]} /></ChartCard>
      <ChartCard title="Sales pipeline value" sub="Current value by stage"><HBars data={d.pipelineValue} format={(n) => kes(n)} /></ChartCard>
      <ChartCard title="Customer activity" sub="Conversations and new customers"><TimeChart title="Customer activity" kind="bar" data={d.customerActivity} series={[{ key: 'conversations', label: 'Conversations' }, { key: 'newCustomers', label: 'New customers', color: 2 }]} /></ChartCard>
      <ChartCard title="Automation activity" sub="Workflow runs"><TimeChart title="Automation activity" kind="stack" data={d.automationSeries} series={[{ key: 'success', label: 'Completed' }, { key: 'failed', label: 'Failed', color: 1 }]} /></ChartCard>
      <ChartCard title="AI vs human conversations" sub={`${pct(d.aiShare, 0)} handled by AI without a human · ${d.conversations} conversations`}><TimeChart title="AI versus human conversations" kind="stack" data={d.aiVsHuman} series={[{ key: 'ai', label: 'AI resolved' }, { key: 'human', label: 'Human involved', color: 3 }]} /></ChartCard>
    </div>)}</Frame>
}

export function SalesAnalytics() {
  return <Frame ns="sales" tab="sales" title="Sales" sub="Sales performance over" cols="xl:grid-cols-7" load={getSales}>{(d) => (
    <div className={grid}>
      <ChartCard title="Lead trend" sub="New and qualified leads"><TimeChart title="Lead trend" kind="line" data={d.leadTrend} series={[{ key: 'leads', label: 'New leads' }, { key: 'qualified', label: 'Qualified', color: 2 }]} /></ChartCard>
      <ChartCard title="Pipeline trend" sub="Value of leads created"><TimeChart title="Pipeline trend" kind="area" format={(n) => kes(n)} data={d.pipelineTrend} series={[{ key: 'value', label: 'Value created' }]} /></ChartCard>
      <ChartCard title="Conversion funnel"><Funnel data={d.funnel} /></ChartCard>
      <ChartCard title="Revenue by source" sub="Value of deals won in this range"><HBars data={d.revenueBySource} format={(n) => kes(n)} empty="No deals won in this range" /></ChartCard>
      <ChartCard className="lg:col-span-2" title="Performance by owner" sub="Leads created in range, deals won in range">
        <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-fg3"><th className="py-2 font-semibold">Owner</th><th className="py-2 text-right font-semibold">Leads</th><th className="py-2 text-right font-semibold">Won</th><th className="py-2 text-right font-semibold">Won value</th><th className="py-2 text-right font-semibold">Conversion</th><th className="py-2 text-right font-semibold">Open now</th></tr></thead>
          <tbody>{d.byOwner.map((o) => <tr key={o.id} className="border-b border-edge/60 last:border-0"><th scope="row" className="py-2.5 text-left font-medium"><Link className="hover:text-accent-ink" to={`/app/crm/leads?owner=${o.id}`}>{o.name}</Link></th><td className="num py-2.5 text-right">{o.leads}</td><td className="num py-2.5 text-right">{o.won}</td><td className="num py-2.5 text-right font-semibold">{kes(o.value)}</td><td className="num py-2.5 text-right">{pct(o.rate)}</td><td className="num py-2.5 text-right">{o.open}</td></tr>)}</tbody></table></div></ChartCard>
    </div>)}</Frame>
}

export function CustomerAnalytics() {
  return <Frame ns="customers" tab="customers" title="Customers" sub="Customer health over" cols="xl:grid-cols-5" load={getCustomers}>{(d) => (
    <div className={grid}>
      <ChartCard title="Customer growth" sub="Total customers at the end of each period"><TimeChart title="Customer growth" kind="area" data={d.growth} series={[{ key: 'customers', label: 'Customers' }]} /></ChartCard>
      <ChartCard title="Customer activity" sub="Conversations and new customers"><TimeChart title="Customer activity" kind="bar" data={d.activity} series={[{ key: 'conversations', label: 'Conversations' }, { key: 'newCustomers', label: 'New customers', color: 2 }]} /></ChartCard>
      <ChartCard title="Conversation volume by channel"><Donut title="Conversations by channel" data={d.channelMix} sub="conversations" /></ChartCard>
      <ChartCard title="Response time" sub="Average first reply"><TimeChart title="Response time" kind="line" format={secLabel} data={d.responseSeries} series={[{ key: 'seconds', label: 'First reply' }]} /></ChartCard>
      <ChartCard title="Retention and re-engagement" sub="Active in the last 30 days, re-engaged after 35+ quiet days, and inactive now"><HBars data={d.retention} /></ChartCard>
    </div>)}</Frame>
}

export function AutomationAnalytics() {
  return <Frame ns="automation" tab="automation" title="Automation" sub="Automation results over" cols="xl:grid-cols-7" load={getAutomation}>{(d) => (
    <div className="space-y-4">
      <ChartCard title="Workflow runs" sub="Completed and failed runs"><TimeChart title="Workflow runs" kind="stack" data={d.runSeries} series={[{ key: 'success', label: 'Completed' }, { key: 'failed', label: 'Failed', color: 1 }]} /></ChartCard>
      <ChartCard title="Workflow performance"><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-fg3"><th className="py-2 font-semibold">Workflow</th><th className="py-2 font-semibold">Status</th><th className="py-2 text-right font-semibold">Runs</th><th className="py-2 text-right font-semibold">Success</th><th className="py-2 text-right font-semibold">Failure</th><th className="py-2 text-right font-semibold">Avg. duration</th></tr></thead>
        <tbody>{d.workflows.map((w) => <tr key={w.id} className="border-b border-edge/60 last:border-0"><th scope="row" className="py-2.5 text-left font-medium"><Link className="hover:text-accent-ink" to={`/app/flows/${w.id}`}>{w.name}</Link></th><td className="py-2.5"><StatusBadge status={w.status} /></td><td className="num py-2.5 text-right"><Link className="text-accent-ink hover:underline" to={`/app/flows/runs?workflow=${w.id}`}>{w.runs}</Link></td><td className="num py-2.5 text-right">{w.success}</td><td className="num py-2.5 text-right">{w.failure > 0 ? <Link className="font-semibold text-bad hover:underline" to={`/app/flows/runs?workflow=${w.id}&status=failed`}>{w.failure}</Link> : 0}</td><td className="num py-2.5 text-right">{w.avgMs ? duration(w.avgMs) : '—'}</td></tr>)}</tbody></table></div></ChartCard>
    </div>)}</Frame>
}

export function AiAnalytics() {
  return <Frame ns="ai" tab="ai" title="AI" sub="VEYA Agent results over" cols="xl:grid-cols-4" load={getAiAnalytics}>{(d) => (
    <div className={grid}>
      <ChartCard title="AI vs human workload" sub="Who handled each conversation"><Donut title="AI versus human workload" data={d.workload} sub="conversations" /></ChartCard>
      <ChartCard title="AI conversation outcomes"><HBars data={d.outcomes} /></ChartCard>
      <ChartCard title="Workload over time"><TimeChart title="Workload over time" kind="stack" data={d.trend} series={[{ key: 'ai', label: 'AI resolved' }, { key: 'human', label: 'Human involved', color: 3 }]} /></ChartCard>
      <ChartCard title="Escalation reasons" sub="Why conversations were handed to a person"><HBars data={d.escalationReasons} empty="No escalations in this range" /></ChartCard>
      <ChartCard className="lg:col-span-2" title="Agent performance"><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead><tr className="border-b border-edge text-left text-[11px] uppercase tracking-wide text-fg3"><th className="py-2 font-semibold">Agent</th><th className="py-2 font-semibold">Status</th><th className="py-2 text-right font-semibold">Conversations</th><th className="py-2 text-right font-semibold">Resolution</th><th className="py-2 text-right font-semibold">Escalations</th><th className="py-2 text-right font-semibold">Leads</th></tr></thead>
        <tbody>{d.agents.map((a) => <tr key={a.id} className="border-b border-edge/60 last:border-0"><th scope="row" className="py-2.5 text-left font-medium"><Link className="hover:text-accent-ink" to={`/app/agent/${a.id}`}>{a.name}</Link></th><td className="py-2.5"><StatusBadge status={a.status} /></td><td className="num py-2.5 text-right">{a.conversations}</td><td className="num py-2.5 text-right">{a.conversations ? pct(a.resolution, 0) : '—'}</td><td className="num py-2.5 text-right">{a.escalations}</td><td className="num py-2.5 text-right">{a.leads}</td></tr>)}</tbody></table></div>
        <p className="mt-3 text-xs text-fg3">Resolution is the share of conversations closed without a human. It measures workload, not answer quality; quality scoring is not tracked yet. Knowledge searches are not tracked yet either.</p></ChartCard>
    </div>)}</Frame>
}
