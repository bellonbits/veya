import { useDb } from '../store/db'
import { STATUS_ORDER } from '../types'
import { orgUsers } from './common'
import { listConversations } from './inbox'

export async function getOverviewFeed(orgId: string) {
  const s = useDb.getState()
  const leads = s.leads.filter((l) => l.orgId === orgId)
  const pipeline = STATUS_ORDER.map((st) => { const x = leads.filter((l) => l.status === st); return { status: st, count: x.length, value: x.reduce((a, l) => a + l.value, 0) } })
  const convs = (await listConversations(orgId, { filter: 'all' })).items.slice(0, 6)
  const acts = s.activities.filter((a) => a.orgId === orgId)
  const automation = acts.filter((a) => a.actor.kind === 'workflow' || a.actor.kind === 'ai' || a.type === 'workflow').sort((a, b) => b.at - a.at).slice(0, 7)
  const team = orgUsers(orgId).map((u) => ({
    user: u, openLeads: leads.filter((l) => l.ownerId === u.id && l.status !== 'won' && l.status !== 'lost').length,
    openTasks: s.tasks.filter((t) => t.assigneeId === u.id && t.status === 'open').length,
    last: acts.filter((a) => a.actor.id === u.id).sort((a, b) => b.at - a.at)[0],
  }))
  const week = Date.now() - 7 * 86_400_000
  const loop = {
    conversations: s.conversations.filter((c) => c.orgId === orgId && c.createdAt >= week).length, leads: leads.filter((l) => l.createdAt >= week).length,
    runs: s.runs.filter((r) => r.orgId === orgId && r.startedAt >= week).length, won: leads.filter((l) => l.status === 'won' && (l.closedAt ?? 0) >= week).length,
  }
  return { pipeline, convs, automation, team, loop }
}
