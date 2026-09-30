import { Link } from 'react-router-dom'
import { ArrowRight, Play, Plus, Sparkles } from 'lucide-react'
import { Page } from '../layouts/Page'
import { useOrg, useService } from '../hooks'
import { getOverview } from '../services/analytics'
import { getOverviewFeed } from '../services/overview'
import { makeRange } from '../lib/range'
import { Avatar, Card, MetricCard, PageHeader, SectionHeader } from '../components/ui/Display'
import { Button } from '../components/ui/Button'
import { ErrorState, CardsSkeleton, EmptyState } from '../components/ui/States'
import { Skeleton } from '../components/ui/Display'
import { ActivityBody, ChannelTag } from '../components/domain/Common'
import { ago, greeting, kes } from '../lib/format'
import { useStory } from '../store/story'
import { useUi } from '../store/ui'
import { useMemo } from 'react'
import { cap } from '../lib/format'

export default function Overview() {
  const { orgId, user, org } = useOrg()
  const range = useMemo(() => makeRange('7d'), [])
  const ov = useService('overview', () => getOverview(orgId, range), [orgId])
  const feed = useService('overview-feed', () => getOverviewFeed(orgId), [orgId])
  const { start, running } = useStory()
  const setQC = useUi((s) => s.setQuickCreate)
  const first = user.name.split(' ')[0]
  const totalLeads = feed.data?.pipeline.reduce((a, p) => a + p.count, 0) ?? 0
  const maxCount = Math.max(1, ...(feed.data?.pipeline.map((p) => p.count) ?? [1]))

  return (
    <Page>
      <title>Overview · VEYA</title>
      <PageHeader title={`${greeting()}, ${first}`} sub={<>Here's what's happening across {org.name}. <span className="text-fg3">Showing {range.label.toLowerCase()}.</span></>}
        actions={<><Button icon={<Plus className="h-4 w-4" />} onClick={() => setQC('lead')}>New lead</Button>
          <Button variant="accent" icon={<Play className="h-4 w-4" />} loading={running} onClick={start}>Simulate customer inquiry</Button></>} />

      {ov.error ? <ErrorState error={ov.error} onRetry={ov.refetch} /> : !ov.data ? <CardsSkeleton /> : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {ov.data.metrics.map((m) => <MetricCard key={m.key} label={m.label} value={m.display} delta={m.delta} hint={m.hint} href={m.href} invert={m.invertDelta} unit={m.key === 'response' || m.key === 'conversion' ? ' pts' : '%'} />)}
        </div>
      )}

      {feed.data && (
        <Card className="mt-4 !p-3 sm:!p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.09em] text-fg3"><Sparkles className="h-3.5 w-3.5" aria-hidden />One connected loop · last 7 days</p>
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-0">
            {[['Conversations', feed.data.loop.conversations, '/app/inbox'], ['Leads created', feed.data.loop.leads, '/app/crm/leads'], ['Workflow runs', feed.data.loop.runs, '/app/flows/runs'], ['Deals won', feed.data.loop.won, '/app/analytics/sales']].map(([l, v, to], i) => (
              <li key={l as string} className="flex items-center">
                <Link to={to as string} className="flex-1 rounded-lg px-3 py-2 hover:bg-sunk"><span className="num block text-xl font-semibold text-fg">{v}</span><span className="text-xs text-fg2">{l}</span></Link>
                {i < 3 && <ArrowRight className="hidden h-4 w-4 shrink-0 text-fg3 sm:block" aria-hidden />}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Lead pipeline" sub={`${totalLeads} leads · ${kes(feed.data?.pipeline.filter((p) => p.status !== 'won' && p.status !== 'lost').reduce((a, p) => a + p.value, 0) ?? 0)} open value`} action={<Link to="/app/crm/pipeline" className="text-xs font-semibold text-accent-ink hover:underline">Open pipeline</Link>} />
          {!feed.data ? <Skeleton className="h-52" /> : (
            <ul className="space-y-1">
              {feed.data.pipeline.map((p) => (
                <li key={p.status}>
                  <Link to={`/app/crm/leads?status=${p.status}`} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-sunk">
                    <span className="text-fg2">{cap(p.status)}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-sunk"><span className="block h-full rounded-full" style={{ width: `${Math.max(2, (p.count / maxCount) * 100)}%`, background: p.status === 'lost' ? 'var(--c-chart-muted)' : 'var(--c-chart-1)' }} /></span>
                    <span className="num w-24 text-right"><b className="font-semibold text-fg">{p.count}</b> <span className="text-fg3">{kes(p.value)}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card pad={false}>
          <div className="p-4 pb-2 sm:p-5 sm:pb-2"><SectionHeader title="Conversation activity" action={<Link to="/app/inbox" className="text-xs font-semibold text-accent-ink hover:underline">Open inbox</Link>} /></div>
          {!feed.data ? <div className="p-5"><Skeleton className="h-52" /></div> : feed.data.convs.length === 0 ? <EmptyState compact title="No conversations yet" body="Conversations from WhatsApp, your website and email will show up here." action={<Button onClick={() => setQC('conversation')}>New conversation</Button>} /> : (
            <ul className="divide-y divide-edge">
              {feed.data.convs.map((c) => (
                <li key={c.id}>
                  <Link to={`/app/inbox/${c.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-sunk sm:px-5">
                    <Avatar name={c.customerName} size={30} />
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-semibold text-fg">{c.customerName}{c.unread > 0 && <span className="h-1.5 w-1.5 rounded-full bg-accent"><span className="sr-only">unread</span></span>}</span>
                      <span className="block truncate text-[13px] text-fg2">{c.lastMessage}</span></span>
                    <span className="flex flex-col items-end gap-1"><span className="text-xs text-fg3">{ago(c.lastMessageAt)}</span><ChannelTag channel={c.channel} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionHeader title="Automation activity" sub="What VEYA Agent and your workflows just did" action={<Link to="/app/flows/runs" className="text-xs font-semibold text-accent-ink hover:underline">All runs</Link>} />
          {!feed.data ? <Skeleton className="h-52" /> : (
            <ul className="space-y-3">{feed.data.automation.map((a) => <li key={a.id} className="flex items-start justify-between gap-3 text-sm text-fg"><span className="min-w-0"><ActivityBody a={a} /></span><span className="shrink-0 text-xs text-fg3">{ago(a.at)}</span></li>)}</ul>
          )}
        </Card>

        <Card>
          <SectionHeader title="Team activity" action={<Link to="/app/settings/team" className="text-xs font-semibold text-accent-ink hover:underline">Team</Link>} />
          {!feed.data ? <Skeleton className="h-52" /> : (
            <ul className="divide-y divide-edge">
              {feed.data.team.map((t) => (
                <li key={t.user.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={t.user.name} hue={t.user.hue} size={32} />
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-fg">{t.user.name} <span className="font-normal text-fg3">· {t.user.title}</span></p>
                    <p className="truncate text-xs text-fg2">{t.last ? `${t.last.text} · ${ago(t.last.at)}` : 'No recent activity'}</p></div>
                  <div className="num text-right text-xs text-fg2"><p>{t.openLeads} leads</p><p>{t.openTasks} tasks</p></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <p className="mt-6 text-xs text-fg3">Metrics are computed from platform events for {range.label.toLowerCase()} and refresh as records change. Click any metric to see the records behind it.</p>
    </Page>
  )
}
