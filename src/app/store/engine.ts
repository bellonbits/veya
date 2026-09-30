import type { Actor, RunStep, Workflow, WorkflowRun, WFNode } from '../types'
import { HOUR } from '../lib/format'
import { USERS } from '../data/seed'
import type { DbApi } from './db'

export interface RunContext { leadId?: string; customerId?: string; conversationId?: string; triggeredBy: string }

const fill = (tpl: string, name: string) => tpl.replaceAll('{{customer}}', name.split(' ')[0])

/**
 * Executes a workflow against live platform state. Real effects (tasks, assignment, tags, messages,
 * notifications, status) go through the same store actions the UI uses, so Inbox, CRM, Dashboard and
 * Analytics all reflect what a run did. Email and webhook nodes are recorded as simulated until channels exist.
 */
export function executeWorkflow(db: DbApi, wf: Workflow, ctx: RunContext): WorkflowRun {
  const actor: Actor = { kind: 'workflow', name: wf.name }
  const startedAt = Date.now()
  const steps: RunStep[] = []
  const byId = new Map(wf.nodes.map((n) => [n.id, n]))
  const trigger = wf.nodes.find((n) => n.type === 'trigger')
  let status: WorkflowRun['status'] = 'completed'
  db.emitEvent(wf.orgId, 'workflow.started', wf.id, { workflowId: wf.id })

  const lead = () => db.getState().leads.find((l) => l.id === ctx.leadId)
  const customer = () => db.getState().customers.find((c) => c.id === (ctx.customerId ?? lead()?.customerId))
  const conversation = () => {
    const s = db.getState()
    return s.conversations.find((c) => c.id === ctx.conversationId) ?? s.conversations.filter((c) => c.customerId === customer()?.id).sort((a, b) => b.lastMessageAt - a.lastMessageAt)[0]
  }

  let cur: WFNode | undefined = trigger
  let clock = startedAt
  let guard = 0
  while (cur && guard++ < 40) {
    const node: WFNode = cur
    if (node.type === 'end') break
    const p = node.data.params
    const c = customer()
    const name = c?.name ?? 'there'
    const step: RunStep = { nodeId: node.id, label: node.data.label, kind: node.data.kind, status: 'completed', startedAt: clock, durationMs: 30 + ((guard * 97) % 320), input: { leadId: ctx.leadId, customerId: c?.id, params: p } }
    let branch: 'yes' | 'no' | undefined
    try {
      switch (node.data.kind) {
        case 'action.ai_qualify': {
          const l = lead(); if (!l) throw new Error('No lead in context')
          const hasBudget = !!l.qualification.Budget
          const score = Math.max(l.score, hasBudget ? 78 : 45)
          if (score >= 60 && l.status === 'new') db.updateLead(l.id, { score, status: 'qualified' }, actor)
          else db.updateLead(l.id, { score }, actor)
          step.output = { score, qualified: score >= 60, basis: hasBudget ? 'budget + product interest captured' : 'insufficient qualification data' }
          break
        }
        case 'cond.score': case 'cond.if_else': case 'cond.lead_status': case 'cond.customer_field': case 'cond.message_contains': case 'cond.time': {
          const l = lead()
          let r = false
          if (node.data.kind === 'cond.score') r = (l?.score ?? 0) >= Number(p.value || 60)
          else if (node.data.kind === 'cond.lead_status') r = l?.status === p.value
          else if (node.data.kind === 'cond.time') { const h = new Date().getHours(); r = (h >= 8 && h < 18) === (p.value === 'within business hours') }
          else if (node.data.kind === 'cond.message_contains') {
            const last = db.getState().messages.filter((m) => m.conversationId === conversation()?.id && m.author === 'customer').at(-1)
            r = !!last?.text.toLowerCase().includes((p.value ?? '').toLowerCase())
          } else {
            const src: Record<string, unknown> = node.data.kind === 'cond.customer_field' ? { ...(c ?? {}), tags: c?.tags.join(',') } : { ...(l ?? {}), budget: l?.qualification.Budget }
            const lhs = String(src[p.field] ?? '')
            r = p.op === '>=' ? Number(lhs) >= Number(p.value) : p.op === 'contains' ? lhs.toLowerCase().includes((p.value ?? '').toLowerCase()) : lhs.toLowerCase() === (p.value ?? '').toLowerCase()
          }
          branch = r ? 'yes' : 'no'
          step.output = { result: r, branch }
          break
        }
        case 'action.assign_user': {
          const l = lead(); if (!l) throw new Error('No lead in context')
          const reps = USERS.filter((u) => u.orgId === wf.orgId && (u.role === 'agent' || u.role === 'manager'))
          const load = (id: string) => db.getState().leads.filter((x) => x.ownerId === id && x.status !== 'won' && x.status !== 'lost').length
          const rep = [...reps].sort((a, b) => load(a.id) - load(b.id))[0]
          db.assignLead(l.id, rep.id, actor)
          step.output = { assignedTo: rep.name, strategy: p.strategy }
          break
        }
        case 'action.create_task': {
          const t = db.createTask({ title: fill(p.title || 'Follow up with {{customer}}', name), dueAt: Date.now() + Number(p.dueInHours || 24) * HOUR, priority: 'medium', leadId: ctx.leadId, customerId: c?.id, assigneeId: lead()?.ownerId }, actor)
          step.output = { taskId: t.id, title: t.title }
          break
        }
        case 'action.notify_team':
          db.addNotification(wf.orgId, { type: 'lead', title: 'Workflow notification', body: fill(p.message || 'Update', name), href: ctx.leadId ? `/app/crm/leads/${ctx.leadId}` : '/app/flows/runs' })
          step.output = { notified: 'team' }
          break
        case 'action.send_message': {
          const cv = conversation()
          if (!cv) { step.status = 'skipped'; step.output = { reason: 'No conversation to send into' }; break }
          db.sendMessage(cv.id, { text: fill(p.text || '', name), author: 'ai' })
          step.output = { conversationId: cv.id, delivered: true }
          break
        }
        case 'action.add_tag':
          if (c) db.updateCustomer(c.id, { tags: [...new Set([...c.tags, p.tag])] }, actor)
          step.output = { tag: p.tag }
          break
        case 'action.update_lead': {
          const l = lead(); if (!l) throw new Error('No lead in context')
          db.updateLead(l.id, { status: p.status as never }, actor)
          step.output = { status: p.status }
          break
        }
        case 'action.create_lead': {
          if (lead() || !c) { step.output = { skipped: 'Lead already exists' }; break }
          const nl = db.createLead({ customerId: c.id, title: 'New enquiry', source: 'Website', value: 0, createdBy: 'workflow' }, actor)
          ctx.leadId = nl.id
          step.output = { leadId: nl.id }
          break
        }
        case 'action.wait':
          step.status = 'waiting'; step.durationMs = 0
          step.output = { resumesAt: Date.now() + Number(p.hours || 24) * HOUR }
          status = 'waiting'
          break
        case 'action.send_email': case 'action.webhook': case 'action.trigger_agent': case 'action.update_customer':
          step.output = { mode: 'simulated', note: 'No live channel is connected for this step yet.' }
          break
        default:
          step.output = { ok: true }
      }
    } catch (e) {
      step.status = 'failed'; step.error = e instanceof Error ? e.message : 'Unknown error'; status = 'failed'
    }
    steps.push(step)
    clock += step.durationMs
    if (status === 'failed' || status === 'waiting') break
    const outs = wf.edges.filter((ed) => ed.source === node.id)
    const next: string | undefined = node.type === 'condition' ? (outs.find((o) => o.sourceHandle === branch) ?? outs[0])?.target : outs[0]?.target
    cur = next ? byId.get(next) : undefined
  }
  const completedAt = status === 'waiting' ? undefined : clock
  const run: WorkflowRun = { id: db.newId('run'), orgId: wf.orgId, workflowId: wf.id, startedAt, completedAt, status, steps, leadId: ctx.leadId, customerId: ctx.customerId ?? customer()?.id, conversationId: ctx.conversationId, triggeredBy: ctx.triggeredBy }
  db.saveRun(run, wf, actor)
  return run
}
