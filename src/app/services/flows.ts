import { useDb } from '../store/db'
import type { Agent, ListQuery, Page, Workflow, WorkflowRun } from '../types'
import { matches, notFound, paginate } from './common'

const S = () => useDb.getState()

export interface WorkflowRow extends Workflow { trigger: string; runs: number; successRate: number | null; lastRun?: number; failed: number; avgDurationMs: number }
/* GET /api/v1/workflows */
export async function listWorkflows(orgId: string, q: ListQuery = {}): Promise<WorkflowRow[]> {
  const s = S()
  return s.workflows.filter((w) => w.orgId === orgId && (!q.status || w.status === q.status) && matches(q.q as string, w.name, w.description)).map((w) => {
    const runs = s.runs.filter((r) => r.workflowId === w.id)
    const done = runs.filter((r) => r.status === 'completed' || r.status === 'failed')
    const ok = done.filter((r) => r.status === 'completed')
    return {
      ...w, trigger: w.nodes.find((n) => n.type === 'trigger')?.data.label ?? '—', runs: runs.length, successRate: done.length ? (ok.length / done.length) * 100 : null,
      lastRun: runs.reduce<number | undefined>((m, r) => (m === undefined || r.startedAt > m ? r.startedAt : m), undefined), failed: done.length - ok.length,
      avgDurationMs: ok.length ? ok.reduce((a, r) => a + ((r.completedAt ?? r.startedAt) - r.startedAt), 0) / ok.length : 0,
    }
  }).sort((a, b) => b.updatedAt - a.updatedAt)
}
/* GET /api/v1/workflows/{id} */
export async function getWorkflow(orgId: string, id: string): Promise<WorkflowRow & { recentRuns: WorkflowRun[] }> {
  const row = (await listWorkflows(orgId)).find((w) => w.id === id)
  if (!row) throw notFound('Workflow')
  return { ...row, recentRuns: S().runs.filter((r) => r.workflowId === id).sort((a, b) => b.startedAt - a.startedAt).slice(0, 8) }
}
export interface RunRow extends WorkflowRun { workflowName: string; customerName?: string; leadNumber?: number }
export async function listRuns(orgId: string, q: ListQuery = {}): Promise<Page<RunRow> & { counts: Record<string, number> }> {
  const s = S()
  const wf = new Map(s.workflows.map((w) => [w.id, w.name]))
  const all: RunRow[] = s.runs.filter((r) => r.orgId === orgId).map((r) => ({
    ...r, workflowName: wf.get(r.workflowId) ?? 'Deleted workflow', customerName: s.customers.find((c) => c.id === r.customerId)?.name, leadNumber: s.leads.find((l) => l.id === r.leadId)?.number,
  })).sort((a, b) => b.startedAt - a.startedAt)
  const counts: Record<string, number> = { all: all.length }
  all.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1 })
  return { ...paginate(all.filter((r) => (!q.status || r.status === q.status) && (!q.workflow || r.workflowId === q.workflow)), q, 20), counts }
}
export async function getRun(orgId: string, id: string): Promise<RunRow & { workflow?: Workflow }> {
  const row = (await listRuns(orgId, { pageSize: 100000 })).items.find((r) => r.id === id)
  if (!row) throw notFound('Workflow run')
  return { ...row, workflow: S().workflows.find((w) => w.id === row.workflowId) }
}

export interface AgentRow extends Agent { conversations: number; resolutionRate: number | null; escalations: number; lastActivity?: number }
/* GET /api/v1/agents */
export async function listAgents(orgId: string): Promise<AgentRow[]> {
  const s = S()
  return s.agents.filter((a) => a.orgId === orgId).map((a) => {
    const convs = s.conversations.filter((c) => c.agentId === a.id)
    const esc = convs.filter((c) => c.escalated).length
    return { ...a, conversations: convs.length, escalations: esc, resolutionRate: convs.length ? (convs.filter((c) => c.handledBy === 'ai' && !c.escalated).length / convs.length) * 100 : null, lastActivity: convs.reduce<number | undefined>((m, c) => (m === undefined || c.lastMessageAt > m ? c.lastMessageAt : m), undefined) }
  })
}
export async function getAgent(orgId: string, id: string): Promise<AgentRow> {
  const a = (await listAgents(orgId)).find((x) => x.id === id)
  if (!a) throw notFound('Agent')
  return a
}
export const listKnowledge = async (orgId: string, agentId?: string) => S().knowledge.filter((k) => k.orgId === orgId && (!agentId || k.agentId === agentId)).sort((a, b) => b.updatedAt - a.updatedAt)
