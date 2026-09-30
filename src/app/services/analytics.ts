import { useDb } from '../store/db'
import type { DateRange, EventName, LeadStatus, PlatformEvent } from '../types'
import { FUNNEL_ORDER, STATUS_ORDER } from '../types'
import { DAY, cap, shortDate } from '../lib/format'
import { rangeDays, rangeQuery } from '../lib/range'
import { orgUsers, userById } from './common'

/**
 * Analytics are pure functions of platform events + current records for one organization and date range.
 * Nothing here is hard-coded; a FastAPI endpoint can return the same shapes from its event store.
 */
export interface Metric { key: string; label: string; value: number; display: string; delta: number | null; hint: string; href: string; invertDelta?: boolean }
export interface Point { label: string; t: number; [series: string]: number | string }
export interface Slice { label: string; value: number; href?: string }

const inR = (t: number, from: number, to: number) => t >= from && t < to
const pctChange = (cur: number, prev: number) => (prev === 0 ? (cur === 0 ? 0 : null) : ((cur - prev) / prev) * 100)
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const ratio = (a: number, b: number) => (b ? (a / b) * 100 : 0)
const fmtPct = (n: number) => `${n.toFixed(1)}%`

function bucketsFor(r: DateRange) {
  const days = rangeDays(r), step = days <= 31 ? DAY : 7 * DAY
  const out: { start: number; end: number; label: string }[] = []
  for (let t = r.from; t < r.to; t += step) out.push({ start: t, end: Math.min(t + step, r.to), label: step === DAY ? shortDate(t) : `${shortDate(t)}` })
  return out
}
const series = (r: DateRange, fn: (from: number, to: number) => Record<string, number>): Point[] => bucketsFor(r).map((b) => ({ label: b.label, t: b.start, ...fn(b.start, b.end) }))

function base(orgId: string, r: DateRange) {
  const s = useDb.getState()
  const prev: DateRange = { ...r, from: r.from - (r.to - r.from), to: r.from }
  const ev = s.events.filter((e) => e.orgId === orgId)
  const count = (name: EventName, from: number, to: number, pred?: (e: PlatformEvent) => boolean) => ev.filter((e) => e.name === name && inR(e.at, from, to) && (!pred || pred(e))).length
  const leads = s.leads.filter((l) => l.orgId === orgId)
  const convs = s.conversations.filter((c) => c.orgId === orgId)
  const customers = s.customers.filter((c) => c.orgId === orgId)
  const runs = s.runs.filter((x) => x.orgId === orgId)
  const tasks = s.tasks.filter((t) => t.orgId === orgId)
  const earliest = Math.min(...ev.map((e) => e.at), Date.now())
  return { s, prev, ev, count, leads, convs, customers, runs, tasks, partial: r.from < earliest - DAY, earliest, q: rangeQuery(r), days: rangeDays(r) }
}

const stageValue = (leads: { status: LeadStatus; value: number }[]) => STATUS_ORDER.filter((x) => x !== 'lost').map((st) => ({ label: cap(st), value: leads.filter((l) => l.status === st).reduce((a, l) => a + l.value, 0), href: `/app/crm/leads?status=${st}` }))
function funnel(leads: { reached: number; status: LeadStatus }[], q: string): Slice[] {
  const labels = ['New', 'Qualified', 'Contacted', 'Proposal', 'Negotiation', 'Won']
  return FUNNEL_ORDER.map((st, i) => ({ label: labels[i], value: leads.filter((l) => l.reached >= i).length, href: i === 0 ? `/app/crm/leads?${q}` : `/app/crm/leads?${q}&status=${st}` }))
}

export async function getOverview(orgId: string, r: DateRange) {
  const b = base(orgId, r)
  const cur = (name: EventName) => b.count(name, r.from, r.to), prv = (name: EventName) => b.count(name, b.prev.from, b.prev.to)
  const newLeads = cur('lead.created'), qualified = cur('lead.qualified')
  const respRate = (from: number, to: number) => { const c = b.convs.filter((x) => inR(x.createdAt, from, to)); return ratio(c.filter((x) => x.firstResponseSec !== undefined).length, c.length) }
  const conv = (from: number, to: number) => ratio(b.count('lead.won', from, to), b.count('lead.created', from, to))
  const activeAt = (t: number) => b.customers.filter((c) => c.createdAt <= t && c.lastInteractionAt >= t - 30 * DAY).length
  const openFollow = b.tasks.filter((t) => t.status === 'open').length
  const metrics: Metric[] = [
    { key: 'newLeads', label: 'New leads', value: newLeads, display: String(newLeads), delta: pctChange(newLeads, prv('lead.created')), hint: 'vs previous period', href: `/app/crm/leads?${b.q}` },
    { key: 'qualified', label: 'Qualified leads', value: qualified, display: String(qualified), delta: pctChange(qualified, prv('lead.qualified')), hint: 'vs previous period', href: `/app/crm/leads?${b.q}&status=qualified` },
    { key: 'active', label: 'Active customers', value: activeAt(r.to), display: activeAt(r.to).toLocaleString('en-KE'), delta: pctChange(activeAt(r.to), activeAt(r.from)), hint: 'contacted in prior 30 days', href: '/app/crm/contacts?status=active' },
    { key: 'response', label: 'Response rate', value: respRate(r.from, r.to), display: fmtPct(respRate(r.from, r.to)), delta: respRate(r.from, r.to) - respRate(b.prev.from, b.prev.to), hint: 'conversations answered · pts vs previous', href: '/app/inbox' },
    { key: 'conversion', label: 'Conversion rate', value: conv(r.from, r.to), display: fmtPct(conv(r.from, r.to)), delta: conv(r.from, r.to) - conv(b.prev.from, b.prev.to), hint: 'deals won ÷ new leads · pts vs previous', href: `/app/crm/leads?status=won` },
    { key: 'followups', label: 'Open follow-ups', value: openFollow, display: String(openFollow), delta: null, hint: 'open tasks right now', href: '/app/crm/tasks?view=upcoming' },
  ]
  const inRange = (t: number) => inR(t, r.from, r.to)
  const rl = b.leads.filter((l) => inRange(l.createdAt))
  const sourceCounts = new Map<string, number>()
  rl.forEach((l) => sourceCounts.set(l.source, (sourceCounts.get(l.source) ?? 0) + 1))
  const rc = b.convs.filter((c) => inRange(c.createdAt))
  const sec = (arr: typeof rc) => avg(arr.filter((c) => c.firstResponseSec !== undefined).map((c) => c.firstResponseSec!))
  return {
    range: r, partial: b.partial, metrics,
    leadSeries: series(r, (f, t) => ({ leads: b.count('lead.created', f, t), qualified: b.count('lead.qualified', f, t) })),
    sources: [...sourceCounts].map(([label, value]) => ({ label, value, href: `/app/crm/leads?${b.q}&source=${encodeURIComponent(label)}` })).sort((a, c) => c.value - a.value),
    funnel: funnel(rl, b.q),
    responseSeries: series(r, (f, t) => { const c = b.convs.filter((x) => inR(x.createdAt, f, t)); return { ai: Math.round(sec(c.filter((x) => x.handledBy === 'ai' && !x.escalated))), human: Math.round(sec(c.filter((x) => x.handledBy === 'human' || x.escalated))) } }),
    pipelineValue: stageValue(b.leads),
    customerActivity: series(r, (f, t) => ({ conversations: b.convs.filter((x) => inR(x.createdAt, f, t)).length, newCustomers: b.count('customer.created', f, t) })),
    automationSeries: series(r, (f, t) => ({ success: b.count('workflow.completed', f, t), failed: b.count('workflow.failed', f, t) })),
    aiVsHuman: series(r, (f, t) => { const c = b.convs.filter((x) => inR(x.createdAt, f, t)); return { ai: c.filter((x) => x.handledBy === 'ai' && !x.escalated).length, human: c.filter((x) => x.handledBy === 'human' || x.escalated).length } }),
    aiShare: ratio(rc.filter((c) => c.handledBy === 'ai' && !c.escalated).length, rc.length), avgResponseSec: sec(rc), conversations: rc.length,
  }
}

export async function getSales(orgId: string, r: DateRange) {
  const b = base(orgId, r)
  const created = (from: number, to: number) => b.leads.filter((l) => inR(l.createdAt, from, to))
  const closedIn = (from: number, to: number, st: LeadStatus) => b.leads.filter((l) => l.status === st && l.closedAt !== undefined && inR(l.closedAt, from, to))
  const cycle = (from: number, to: number) => avg(closedIn(from, to, 'won').map((l) => (l.closedAt! - l.createdAt) / DAY))
  const open = b.leads.filter((l) => l.status !== 'won' && l.status !== 'lost')
  const won = closedIn(r.from, r.to, 'won'), lost = closedIn(r.from, r.to, 'lost'), rl = created(r.from, r.to), pl = created(b.prev.from, b.prev.to)
  const conv = ratio(won.length, rl.length), pconv = ratio(closedIn(b.prev.from, b.prev.to, 'won').length, pl.length)
  const kes = (n: number) => (n >= 1e6 ? `KES ${(n / 1e6).toFixed(1)}M` : `KES ${Math.round(n / 1000)}K`)
  const metrics: Metric[] = [
    { key: 'volume', label: 'Lead volume', value: rl.length, display: String(rl.length), delta: pctChange(rl.length, pl.length), hint: 'vs previous period', href: `/app/crm/leads?${b.q}` },
    { key: 'qualified', label: 'Qualified leads', value: b.count('lead.qualified', r.from, r.to), display: String(b.count('lead.qualified', r.from, r.to)), delta: pctChange(b.count('lead.qualified', r.from, r.to), b.count('lead.qualified', b.prev.from, b.prev.to)), hint: 'vs previous period', href: `/app/crm/leads?${b.q}&status=qualified` },
    { key: 'pipeline', label: 'Open pipeline value', value: open.reduce((a, l) => a + l.value, 0), display: kes(open.reduce((a, l) => a + l.value, 0)), delta: null, hint: `${open.length} open leads · now`, href: '/app/crm/pipeline' },
    { key: 'won', label: 'Won deals', value: won.length, display: String(won.length), delta: pctChange(won.length, closedIn(b.prev.from, b.prev.to, 'won').length), hint: `${kes(won.reduce((a, l) => a + l.value, 0))} closed`, href: `/app/crm/leads?status=won` },
    { key: 'lost', label: 'Lost deals', value: lost.length, display: String(lost.length), delta: pctChange(lost.length, closedIn(b.prev.from, b.prev.to, 'lost').length), hint: 'vs previous period', invertDelta: true, href: `/app/crm/leads?status=lost` },
    { key: 'conversion', label: 'Conversion rate', value: conv, display: fmtPct(conv), delta: conv - pconv, hint: 'deals won ÷ new leads · pts vs previous', href: `/app/crm/leads?status=won` },
    { key: 'cycle', label: 'Avg. sales cycle', value: cycle(r.from, r.to), display: `${cycle(r.from, r.to).toFixed(1)} days`, delta: null, hint: 'created → won', href: '/app/crm/leads?status=won' },
  ]
  const bySource = new Map<string, number>()
  won.forEach((l) => bySource.set(l.source, (bySource.get(l.source) ?? 0) + l.value))
  return {
    range: r, partial: b.partial, metrics,
    leadTrend: series(r, (f, t) => ({ leads: created(f, t).length, qualified: b.count('lead.qualified', f, t) })),
    pipelineTrend: series(r, (f, t) => ({ value: created(f, t).reduce((a, l) => a + l.value, 0) })),
    funnel: funnel(rl, b.q), pipelineValue: stageValue(b.leads),
    revenueBySource: [...bySource].map(([label, value]) => ({ label, value, href: `/app/crm/leads?status=won&source=${encodeURIComponent(label)}` })).sort((a, c) => c.value - a.value),
    byOwner: orgUsers(orgId).filter((u) => u.role !== 'viewer').map((u) => {
      const mine = rl.filter((l) => l.ownerId === u.id), w = won.filter((l) => l.ownerId === u.id)
      return { id: u.id, name: u.name, leads: mine.length, won: w.length, value: w.reduce((a, l) => a + l.value, 0), rate: ratio(mine.filter((l) => l.status === 'won').length, mine.length), open: open.filter((l) => l.ownerId === u.id).length }
    }).sort((a, c) => c.value - a.value),
  }
}

export async function getCustomers(orgId: string, r: DateRange) {
  const b = base(orgId, r)
  const newC = b.count('customer.created', r.from, r.to), pNew = b.count('customer.created', b.prev.from, b.prev.to)
  const talked = new Set(b.convs.filter((c) => inR(c.createdAt, r.from, r.to)).map((c) => c.customerId))
  const returning = b.customers.filter((c) => talked.has(c.id) && c.createdAt < r.from).length
  const active = b.customers.filter((c) => c.lastInteractionAt >= r.to - 30 * DAY).length
  const inactive = b.customers.filter((c) => c.status === 'inactive').length
  const engagement = talked.size ? b.convs.filter((c) => inR(c.createdAt, r.from, r.to)).length / talked.size : 0
  const reengaged = b.customers.filter((c) => talked.has(c.id) && c.createdAt < r.from - 35 * DAY).length
  const metrics: Metric[] = [
    { key: 'new', label: 'New customers', value: newC, display: String(newC), delta: pctChange(newC, pNew), hint: 'vs previous period', href: '/app/crm/contacts?sort=createdAt' },
    { key: 'returning', label: 'Returning customers', value: returning, display: String(returning), delta: null, hint: 'existing customers who wrote in', href: '/app/crm/contacts' },
    { key: 'active', label: 'Active customers', value: active, display: active.toLocaleString('en-KE'), delta: null, hint: 'contacted in prior 30 days', href: '/app/crm/contacts?status=active' },
    { key: 'inactive', label: 'Inactive customers', value: inactive, display: String(inactive), delta: null, hint: 'no contact in 35+ days', invertDelta: true, href: '/app/crm/contacts?status=inactive' },
    { key: 'engagement', label: 'Engagement', value: engagement, display: `${engagement.toFixed(1)}×`, delta: null, hint: 'conversations per engaged customer', href: '/app/inbox' },
  ]
  const rc = b.convs.filter((c) => inR(c.createdAt, r.from, r.to))
  return {
    range: r, partial: b.partial, metrics,
    growth: series(r, (_f, t) => ({ customers: b.customers.filter((c) => c.createdAt < t).length })),
    activity: series(r, (f, t) => ({ conversations: b.convs.filter((x) => inR(x.createdAt, f, t)).length, newCustomers: b.count('customer.created', f, t) })),
    channelMix: (['whatsapp', 'website', 'email', 'sms'] as const).map((ch) => ({ label: cap(ch), value: rc.filter((c) => c.channel === ch).length })).filter((x) => x.value),
    responseSeries: series(r, (f, t) => ({ seconds: Math.round(avg(b.convs.filter((x) => inR(x.createdAt, f, t) && x.firstResponseSec !== undefined).map((x) => x.firstResponseSec!))) })),
    retention: [{ label: 'Active', value: active }, { label: 'Re-engaged', value: reengaged }, { label: 'Inactive', value: inactive }],
    partialNote: null as string | null,
  }
}

export async function getAutomation(orgId: string, r: DateRange) {
  const b = base(orgId, r)
  const runs = b.runs.filter((x) => inR(x.startedAt, r.from, r.to)), pruns = b.runs.filter((x) => inR(x.startedAt, b.prev.from, b.prev.to))
  const done = runs.filter((x) => x.status === 'completed' || x.status === 'failed'), ok = done.filter((x) => x.status === 'completed')
  const rc = b.convs.filter((c) => inR(c.createdAt, r.from, r.to)), aiC = rc.filter((c) => c.handledBy === 'ai' && !c.escalated), esc = rc.filter((c) => c.escalated)
  const avgDur = avg(ok.map((x) => (x.completedAt ?? x.startedAt) - x.startedAt))
  const metrics: Metric[] = [
    { key: 'runs', label: 'Automation runs', value: runs.length, display: runs.length.toLocaleString('en-KE'), delta: pctChange(runs.length, pruns.length), hint: 'vs previous period', href: '/app/flows/runs' },
    { key: 'ok', label: 'Success rate', value: ratio(ok.length, done.length), display: fmtPct(ratio(ok.length, done.length)), delta: null, hint: `${ok.length} completed`, href: '/app/flows/runs?status=completed' },
    { key: 'failed', label: 'Failed runs', value: done.length - ok.length, display: String(done.length - ok.length), delta: null, hint: 'needs attention', invertDelta: true, href: '/app/flows/runs?status=failed' },
    { key: 'dur', label: 'Avg. execution time', value: avgDur, display: avgDur < 1000 ? `${Math.round(avgDur)}ms` : `${(avgDur / 1000).toFixed(1)}s`, delta: null, hint: 'completed runs', href: '/app/flows/runs' },
    { key: 'ai', label: 'AI conversations', value: rc.filter((c) => c.handledBy === 'ai').length, display: String(rc.filter((c) => c.handledBy === 'ai').length), delta: null, hint: `of ${rc.length} conversations`, href: '/app/inbox?filter=ai' },
    { key: 'res', label: 'AI resolution', value: ratio(aiC.length, rc.length), display: fmtPct(ratio(aiC.length, rc.length)), delta: null, hint: 'handled without a human', href: '/app/analytics/ai' },
    { key: 'esc', label: 'Human escalations', value: ratio(esc.length, rc.length), display: fmtPct(ratio(esc.length, rc.length)), delta: null, hint: `${esc.length} conversations`, invertDelta: true, href: '/app/inbox?filter=human' },
  ]
  return {
    range: r, partial: b.partial, metrics,
    runSeries: series(r, (f, t) => ({ success: b.count('workflow.completed', f, t), failed: b.count('workflow.failed', f, t) })),
    workflows: b.s.workflows.filter((w) => w.orgId === orgId).map((w) => {
      const wr = runs.filter((x) => x.workflowId === w.id), d = wr.filter((x) => x.status === 'completed' || x.status === 'failed'), o = d.filter((x) => x.status === 'completed')
      return { id: w.id, name: w.name, status: w.status, runs: wr.length, success: o.length, failure: d.length - o.length, avgMs: avg(o.map((x) => (x.completedAt ?? x.startedAt) - x.startedAt)) }
    }).sort((a, c) => c.runs - a.runs),
  }
}

export async function getAiAnalytics(orgId: string, r: DateRange) {
  const b = base(orgId, r)
  const rc = b.convs.filter((c) => inR(c.createdAt, r.from, r.to))
  const ai = rc.filter((c) => c.handledBy === 'ai' || c.escalated), resolved = rc.filter((c) => c.handledBy === 'ai' && !c.escalated)
  const msgs = b.s.messages.filter((m) => m.orgId === orgId)
  const len = avg(ai.map((c) => msgs.filter((m) => m.conversationId === c.id && !m.note).length))
  const aiLeads = b.leads.filter((l) => l.createdBy === 'ai' && inR(l.createdAt, r.from, r.to))
  const responded = ai.filter((c) => c.firstResponseSec !== undefined)
  const reasons = new Map<string, number>()
  b.ev.filter((e) => e.name === 'conversation.escalated' && inR(e.at, r.from, r.to)).forEach((e) => reasons.set(e.meta?.reason ?? 'Unspecified', (reasons.get(e.meta?.reason ?? 'Unspecified') ?? 0) + 1))
  const metrics: Metric[] = [
    { key: 'convs', label: 'AI conversations', value: ai.length, display: String(ai.length), delta: null, hint: `of ${rc.length} total`, href: '/app/inbox?filter=ai' },
    { key: 'res', label: 'AI resolution rate', value: ratio(resolved.length, ai.length), display: fmtPct(ratio(resolved.length, ai.length)), delta: null, hint: 'no human needed', href: '/app/inbox?filter=ai' },
    { key: 'handoff', label: 'Human handoff rate', value: ratio(ai.length - resolved.length, ai.length), display: fmtPct(ratio(ai.length - resolved.length, ai.length)), delta: null, hint: 'escalated or taken over', invertDelta: true, href: '/app/inbox?filter=human' },
    { key: 'resp', label: 'Avg. response time', value: avg(responded.map((c) => c.firstResponseSec!)), display: `${avg(responded.map((c) => c.firstResponseSec!)).toFixed(0)}s`, delta: null, hint: 'first reply', href: '/app/analytics' },
    { key: 'len', label: 'Avg. conversation length', value: len, display: `${len.toFixed(1)} msgs`, delta: null, hint: 'messages per conversation', href: '/app/inbox' },
    { key: 'rate', label: 'Lead creation rate', value: ratio(ai.filter((c) => c.leadId).length, ai.length), display: fmtPct(ratio(ai.filter((c) => c.leadId).length, ai.length)), delta: null, hint: 'conversations → leads', href: '/app/crm/leads' },
    { key: 'gen', label: 'AI-generated leads', value: aiLeads.length, display: String(aiLeads.length), delta: null, hint: 'created by VEYA Agent', href: `/app/crm/leads?${b.q}` },
    { key: 'ks', label: 'Knowledge searches', value: 0, display: '—', delta: null, hint: 'not tracked yet', href: '/app/agent/knowledge' },
  ]
  const humanOnly = rc.filter((c) => c.handledBy === 'human' && !c.escalated)
  return {
    range: r, partial: b.partial, metrics,
    workload: [{ label: 'AI resolved', value: resolved.length }, { label: 'Escalated to human', value: rc.filter((c) => c.escalated).length }, { label: 'Human only', value: humanOnly.length }],
    outcomes: [
      { label: 'Resolved by AI', value: resolved.filter((c) => c.status === 'closed').length }, { label: 'Lead created', value: ai.filter((c) => c.leadId).length },
      { label: 'Escalated', value: ai.filter((c) => c.escalated).length }, { label: 'Still open', value: ai.filter((c) => c.status !== 'closed').length },
    ],
    escalationReasons: [...reasons].map(([label, value]) => ({ label, value })).sort((a, c) => c.value - a.value),
    trend: series(r, (f, t) => { const c = b.convs.filter((x) => inR(x.createdAt, f, t)); return { ai: c.filter((x) => x.handledBy === 'ai' && !x.escalated).length, human: c.filter((x) => x.handledBy === 'human' || x.escalated).length } }),
    agents: b.s.agents.filter((a) => a.orgId === orgId).map((a) => {
      const c = rc.filter((x) => x.agentId === a.id), res = c.filter((x) => x.handledBy === 'ai' && !x.escalated)
      return { id: a.id, name: a.name, status: a.status, conversations: c.length, resolution: ratio(res.length, c.length), escalations: c.filter((x) => x.escalated).length, leads: c.filter((x) => x.leadId).length }
    }),
  }
}

export const ownerName = (id?: string) => userById(id)?.name ?? 'Unassigned'
