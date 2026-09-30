import { create } from 'zustand'
import { buildSnapshot, USERS, type Snapshot } from '../data/seed'
import type {
  Activity, Actor, Agent, AuditEntry, Channel, Conversation, Customer, EventName, KnowledgeItem, Lead, LeadStatus, Message,
  Notification, PlatformEvent, Task, Workflow, WorkflowRun,
} from '../types'
import { FUNNEL_ORDER } from '../types'
import { cap, channelName, kes } from '../lib/format'
import { executeWorkflow, type RunContext } from './engine'
import { getCurrentUser, useSession } from './session'

let counter = 0
export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(++counter).toString(36)}`

interface Actions {
  rev: number
  getState: () => DbState
  newId: typeof newId
  emitEvent: (orgId: string, name: EventName, entityId?: string, meta?: PlatformEvent['meta']) => void
  log: (o: { orgId: string; actor: Actor; type: Activity['type']; text: string; leadId?: string; customerId?: string; conversationId?: string; workflowId?: string; runId?: string }, audit?: { action: string; entityType: AuditEntry['entityType']; entityId: string; entityLabel: string; previous?: string; next?: string }) => void

  createCustomer: (i: Partial<Customer> & { name: string; orgId?: string }, actor?: Actor) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>, actor?: Actor) => void
  createLead: (i: { customerId: string; title: string; source: Lead['source']; value: number; ownerId?: string; qualification?: Record<string, string>; createdBy?: Lead['createdBy']; conversationId?: string; score?: number }, actor?: Actor) => Lead
  updateLead: (id: string, patch: Partial<Lead>, actor?: Actor) => void
  assignLead: (id: string, userId: string | undefined, actor?: Actor) => void
  createTask: (i: Pick<Task, 'title' | 'dueAt'> & Partial<Task>, actor?: Actor) => Task
  toggleTask: (id: string) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  addNote: (target: { leadId?: string; customerId?: string }, text: string) => void

  createConversation: (customerId: string, channel: Channel, opts?: Partial<Conversation>) => Conversation
  sendMessage: (conversationId: string, m: { text: string; author: Message['author']; userId?: string; note?: boolean }) => Message
  assignConversation: (id: string, userId: string | undefined) => void
  setConversationStatus: (id: string, status: Conversation['status']) => void
  tagConversation: (id: string, tag: string, on?: boolean) => void
  escalateConversation: (id: string, reason?: string) => void
  markRead: (id: string) => void
  createLeadFromConversation: (id: string) => Lead | undefined

  triggerWorkflow: (workflowId: string, ctx: Partial<RunContext>) => WorkflowRun | undefined
  dispatch: (trigger: 'lead.created' | 'lead.status_changed' | 'conversation.created' | 'customer.created', orgId: string, ctx: RunContext, to?: string) => void
  saveRun: (run: WorkflowRun, wf: Workflow, actor: Actor) => void
  createWorkflow: (w: Pick<Workflow, 'name' | 'description' | 'nodes' | 'edges'> & Partial<Workflow>) => Workflow
  updateWorkflow: (id: string, patch: Partial<Workflow>) => void
  deleteWorkflow: (id: string) => void
  updateAgent: (id: string, patch: Partial<Agent>) => void
  createAgent: (a: Pick<Agent, 'name' | 'description'>) => Agent
  addKnowledge: (i: Pick<KnowledgeItem, 'title' | 'type'> & { agentId?: string }) => KnowledgeItem
  retryKnowledge: (id: string) => void
  addNotification: (orgId: string, n: Pick<Notification, 'type' | 'title' | 'body' | 'href'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (orgId: string) => void
  reset: () => void
}
export type DbState = Snapshot & Actions
export type DbApi = { getState: () => DbState } & Actions

const sessionOrg = () => useSession.getState().orgId
const meActor = (orgId = sessionOrg()): Actor => { const u = getCurrentUser(orgId); return { kind: 'user', id: u.id, name: u.name } }

let depth = 0

const KEY = 'veya.db.v1'
const SNAP_KEYS: (keyof Snapshot)[] = ['customers', 'companies', 'leads', 'conversations', 'messages', 'tasks', 'activities', 'audit', 'agents', 'knowledge', 'workflows', 'runs', 'notifications', 'events']
/** Demo persistence: survives reloads within a tab so deep links to freshly created records keep working. The API replaces this. */
const loadSnapshot = (): Snapshot => {
  try { const raw = sessionStorage.getItem(KEY); if (raw) { const s = JSON.parse(raw) as Snapshot; if (SNAP_KEYS.every((k) => Array.isArray(s[k]))) return s } } catch { /* ignore */ }
  return buildSnapshot()
}

export const useDb = create<DbState>()((set, get) => {
  const bump = (patch: Partial<Snapshot>) => set((s) => ({ ...patch, rev: s.rev + 1 }) as Partial<DbState>)
  const push = <K extends keyof Snapshot>(key: K, item: Snapshot[K][number]) => set((s) => ({ [key]: [item, ...(s[key] as unknown[])], rev: s.rev + 1 }) as Partial<DbState>)
  const patchIn = <K extends 'customers' | 'leads' | 'conversations' | 'tasks' | 'workflows' | 'agents' | 'knowledge'>(key: K, id: string, patch: Partial<Snapshot[K][number]>) =>
    set((s) => ({ [key]: (s[key] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)), rev: s.rev + 1 }) as Partial<DbState>)
  const lead = (id: string) => get().leads.find((l) => l.id === id)
  const cust = (id: string) => get().customers.find((c) => c.id === id)
  const userName = (id?: string) => (id ? (getUserName(id)) : 'Unassigned')

  const api: Actions = {
    rev: 0,
    getState: get,
    newId,
    emitEvent: (orgId, name, entityId, meta) => push('events', { id: newId('ev'), orgId, at: Date.now(), name, entityId, meta }),
    log: (o, audit) => {
      const at = Date.now()
      push('activities', { id: newId('act'), at, ...o })
      if (audit) push('audit', { id: newId('aud'), orgId: o.orgId, at, actor: o.actor, ...audit })
    },

    createCustomer: (i, actor = meActor()) => {
      const orgId = i.orgId ?? sessionOrg(), now = Date.now()
      const c: Customer = { id: newId('cus'), orgId, phone: '', email: '', location: '', tags: [], status: 'new', createdAt: now, lastInteractionAt: now, custom: {}, ...i }
      push('customers', c)
      api.emitEvent(orgId, 'customer.created', c.id)
      api.log({ orgId, actor, type: 'lead', text: `created contact ${c.name}`, customerId: c.id }, { action: 'customer.created', entityType: 'customer', entityId: c.id, entityLabel: c.name })
      api.dispatch('customer.created', orgId, { customerId: c.id, triggeredBy: 'New Customer' })
      return c
    },
    updateCustomer: (id, patch, actor = meActor()) => {
      const c = cust(id); if (!c) return
      patchIn('customers', id, patch)
      const keys = Object.keys(patch).filter((k) => k !== 'lastInteractionAt')
      if (keys.length) api.log({ orgId: c.orgId, actor, type: 'note', text: `updated ${c.name}: ${keys.join(', ')}`, customerId: id }, { action: 'customer.updated', entityType: 'customer', entityId: id, entityLabel: c.name, next: keys.join(', ') })
    },
    createLead: (i, actor = meActor()) => {
      const c = cust(i.customerId)!, now = Date.now()
      const orgLeads = get().leads.filter((l) => l.orgId === c.orgId)
      const l: Lead = {
        id: newId('lead'), orgId: c.orgId, number: Math.max(0, ...orgLeads.map((x) => x.number)) + 1, customerId: c.id, companyId: c.companyId, title: i.title, source: i.source,
        ownerId: i.ownerId, status: 'new', value: i.value, score: i.score ?? 35, createdAt: now, lastActivityAt: now, nextAction: 'Qualify via VEYA Agent',
        qualification: i.qualification ?? {}, createdBy: i.createdBy ?? 'human', reached: 0,
      }
      push('leads', l)
      api.emitEvent(c.orgId, 'lead.created', l.id, { source: l.source, value: l.value, ownerId: l.ownerId })
      api.log({ orgId: c.orgId, actor, type: 'lead', text: `created Lead #${l.number} — ${l.title}`, leadId: l.id, customerId: c.id, conversationId: i.conversationId }, { action: 'lead.created', entityType: 'lead', entityId: l.id, entityLabel: `Lead #${l.number}`, next: l.title })
      if (i.conversationId) patchIn('conversations', i.conversationId, { leadId: l.id })
      api.dispatch('lead.created', c.orgId, { leadId: l.id, customerId: c.id, conversationId: i.conversationId, triggeredBy: 'New Lead' })
      return get().leads.find((x) => x.id === l.id)!
    },
    updateLead: (id, patch, actor = meActor()) => {
      const l = lead(id); if (!l) return
      const now = Date.now()
      const next: Partial<Lead> = { ...patch, lastActivityAt: now }
      if (patch.status && patch.status !== l.status) {
        const idx = FUNNEL_ORDER.indexOf(patch.status)
        next.reached = Math.max(l.reached, idx)
        if (patch.status === 'qualified' && !l.qualifiedAt) next.qualifiedAt = now
        if (patch.status === 'won' || patch.status === 'lost') next.closedAt = now
        if (patch.status === 'won' && l.reached < 1) next.qualifiedAt = l.qualifiedAt ?? now
        next.nextAction = { new: 'Qualify via VEYA Agent', qualified: 'Assign and make first call', contacted: 'Send property shortlist', proposal: 'Confirm viewing', negotiation: 'Send final offer', won: '—', lost: '—' }[patch.status]
      }
      patchIn('leads', id, next)
      if (patch.status && patch.status !== l.status) {
        api.log({ orgId: l.orgId, actor, type: 'status', text: `moved Lead #${l.number} from ${cap(l.status)} → ${cap(patch.status)}`, leadId: id, customerId: l.customerId }, { action: 'lead.status_changed', entityType: 'lead', entityId: id, entityLabel: `Lead #${l.number}`, previous: cap(l.status), next: cap(patch.status) })
        api.emitEvent(l.orgId, 'lead.status_changed', id, { ownerId: l.ownerId })
        if (patch.status === 'qualified' && !l.qualifiedAt) api.emitEvent(l.orgId, 'lead.qualified', id, { source: l.source, value: l.value, ownerId: l.ownerId })
        if (patch.status === 'won') api.emitEvent(l.orgId, 'lead.won', id, { source: l.source, value: l.value, ownerId: l.ownerId })
        if (patch.status === 'lost') api.emitEvent(l.orgId, 'lead.lost', id, { source: l.source, value: l.value, ownerId: l.ownerId })
        api.dispatch('lead.status_changed', l.orgId, { leadId: id, customerId: l.customerId, triggeredBy: `Lead moved to ${cap(patch.status)}` }, patch.status)
      } else {
        const keys = Object.keys(patch).filter((k) => !['score', 'lastActivityAt'].includes(k))
        if (keys.length) api.log({ orgId: l.orgId, actor, type: 'note', text: `updated Lead #${l.number}: ${keys.join(', ')}${patch.value !== undefined ? ` (${kes(patch.value)})` : ''}`, leadId: id, customerId: l.customerId }, { action: 'lead.updated', entityType: 'lead', entityId: id, entityLabel: `Lead #${l.number}`, next: keys.join(', ') })
      }
    },
    assignLead: (id, userId, actor = meActor()) => {
      const l = lead(id); if (!l) return
      const prev = userName(l.ownerId)
      patchIn('leads', id, { ownerId: userId, lastActivityAt: Date.now() })
      api.log({ orgId: l.orgId, actor, type: 'lead', text: `assigned Lead #${l.number} to ${userName(userId)}`, leadId: id, customerId: l.customerId }, { action: 'lead.assigned', entityType: 'lead', entityId: id, entityLabel: `Lead #${l.number}`, previous: prev, next: userName(userId) })
      if (userId) api.addNotification(l.orgId, { type: 'assigned', title: 'Lead assigned', body: `${cust(l.customerId)?.name} — ${l.title}`, href: `/app/crm/leads/${id}` })
      get().conversations.filter((c) => c.leadId === id && c.status === 'open' && c.handledBy === 'human' && !c.assigneeId).forEach((c) => patchIn('conversations', c.id, { assigneeId: userId }))
    },
    createTask: (i, actor = meActor()) => {
      const l = i.leadId ? lead(i.leadId) : undefined
      const orgId = l?.orgId ?? (i.customerId ? cust(i.customerId)?.orgId : undefined) ?? sessionOrg()
      const t: Task = { id: newId('task'), orgId, priority: 'medium', status: 'open', assigneeId: getCurrentUser(orgId).id, ...i }
      push('tasks', t)
      api.emitEvent(orgId, 'task.created', t.id)
      api.log({ orgId, actor, type: 'task', text: `created task “${t.title}”`, leadId: t.leadId, customerId: t.customerId }, { action: 'task.created', entityType: 'task', entityId: t.id, entityLabel: t.title })
      return t
    },
    toggleTask: (id) => {
      const t = get().tasks.find((x) => x.id === id); if (!t) return
      const done = t.status === 'open'
      patchIn('tasks', id, { status: done ? 'done' : 'open', completedAt: done ? Date.now() : undefined })
      if (done) {
        api.emitEvent(t.orgId, 'task.completed', id)
        api.log({ orgId: t.orgId, actor: meActor(t.orgId), type: 'task', text: `completed task “${t.title}”`, leadId: t.leadId, customerId: t.customerId })
      }
    },
    updateTask: (id, patch) => patchIn('tasks', id, patch),
    addNote: (target, text) => {
      const orgId = (target.leadId ? lead(target.leadId)?.orgId : cust(target.customerId!)?.orgId) ?? sessionOrg()
      api.log({ orgId, actor: meActor(orgId), type: 'note', text: `added a note: “${text}”`, ...target })
    },

    createConversation: (customerId, channel, opts = {}) => {
      const c = cust(customerId)!, now = Date.now()
      const conv: Conversation = { id: `conv_${Math.max(2048, ...get().conversations.map((x) => Number(x.id.split('_')[1]) || 0)) + 1}`, orgId: c.orgId, customerId, channel, status: 'open', handledBy: 'ai', unread: 0, tags: [], createdAt: now, lastMessageAt: now, escalated: false, agentId: get().agents.find((a) => a.orgId === c.orgId && a.status === 'active')?.id, ...opts }
      push('conversations', conv)
      api.emitEvent(c.orgId, 'conversation.created', conv.id, { handledBy: conv.handledBy, channel })
      api.log({ orgId: c.orgId, actor: { kind: 'system', name: 'VEYA' }, type: 'conversation', text: `conversation started on ${channelName(channel)}`, customerId, conversationId: conv.id })
      api.dispatch('conversation.created', c.orgId, { customerId, conversationId: conv.id, triggeredBy: 'New Conversation' })
      return conv
    },
    sendMessage: (conversationId, m) => {
      const conv = get().conversations.find((c) => c.id === conversationId)!, now = Date.now()
      const msg: Message = { id: newId('msg'), orgId: conv.orgId, conversationId, at: now, ...m }
      push('messages', msg)
      const patch: Partial<Conversation> = { lastMessageAt: now }
      if (m.note) { patchIn('conversations', conversationId, {}); return msg }
      if (m.author === 'customer') { patch.unread = conv.unread + 1; if (conv.status !== 'open') patch.status = 'open' }
      else {
        if (conv.firstResponseSec === undefined) patch.firstResponseSec = Math.max(1, Math.round((now - conv.createdAt) / 1000))
        if (m.author === 'human') { patch.handledBy = 'human'; patch.assigneeId = conv.assigneeId ?? m.userId }
      }
      patchIn('conversations', conversationId, patch)
      patchIn('customers', conv.customerId, { lastInteractionAt: now, status: 'active' })
      if (conv.leadId) patchIn('leads', conv.leadId, { lastActivityAt: now })
      api.emitEvent(conv.orgId, m.author === 'customer' ? 'conversation.message_received' : 'conversation.message_sent', conversationId, { handledBy: m.author === 'human' ? 'human' : 'ai' })
      if (m.author === 'ai') api.emitEvent(conv.orgId, 'agent.message_generated', conversationId)
      return msg
    },
    assignConversation: (id, userId) => {
      const conv = get().conversations.find((c) => c.id === id)!
      patchIn('conversations', id, { assigneeId: userId, handledBy: userId ? 'human' : conv.handledBy })
      api.log({ orgId: conv.orgId, actor: meActor(conv.orgId), type: 'conversation', text: `assigned ${id.replace('conv_', 'conversation #')} to ${userName(userId)}`, customerId: conv.customerId, conversationId: id }, { action: 'conversation.assigned', entityType: 'conversation', entityId: id, entityLabel: id.replace('conv_', 'Conversation #'), previous: userName(conv.assigneeId), next: userName(userId) })
    },
    setConversationStatus: (id, status) => {
      const conv = get().conversations.find((c) => c.id === id)!
      patchIn('conversations', id, { status, unread: 0 })
      if (status === 'closed') api.emitEvent(conv.orgId, 'conversation.closed', id)
      api.log({ orgId: conv.orgId, actor: meActor(conv.orgId), type: 'conversation', text: `${status === 'closed' ? 'closed' : status === 'snoozed' ? 'snoozed' : 'reopened'} ${id.replace('conv_', 'conversation #')}`, customerId: conv.customerId, conversationId: id }, { action: 'conversation.status', entityType: 'conversation', entityId: id, entityLabel: id.replace('conv_', 'Conversation #'), previous: cap(conv.status), next: cap(status) })
    },
    tagConversation: (id, tag, on = true) => {
      const conv = get().conversations.find((c) => c.id === id)!
      patchIn('conversations', id, { tags: on ? [...new Set([...conv.tags, tag])] : conv.tags.filter((t) => t !== tag) })
    },
    escalateConversation: (id, reason = 'Manual escalation') => {
      const conv = get().conversations.find((c) => c.id === id)!
      patchIn('conversations', id, { escalated: true, handledBy: 'human', tags: [...new Set([...conv.tags, 'escalated'])] })
      api.emitEvent(conv.orgId, 'conversation.escalated', id, { reason })
      if (conv.handledBy === 'ai') api.emitEvent(conv.orgId, 'agent.escalated', id, { reason })
      api.addNotification(conv.orgId, { type: 'escalation', title: 'Conversation escalated', body: `${cust(conv.customerId)?.name}: ${reason}`, href: `/app/inbox/${id}` })
      api.log({ orgId: conv.orgId, actor: meActor(conv.orgId), type: 'conversation', text: `escalated ${id.replace('conv_', 'conversation #')} to a human`, customerId: conv.customerId, conversationId: id }, { action: 'conversation.escalated', entityType: 'conversation', entityId: id, entityLabel: id.replace('conv_', 'Conversation #'), next: reason })
    },
    markRead: (id) => { if (get().conversations.find((c) => c.id === id)?.unread) patchIn('conversations', id, { unread: 0 }) },
    createLeadFromConversation: (id) => {
      const conv = get().conversations.find((c) => c.id === id)!
      if (conv.leadId) return lead(conv.leadId)
      const c = cust(conv.customerId)!
      const first = get().messages.filter((m) => m.conversationId === id && m.author === 'customer').sort((a, b) => a.at - b.at)[0]
      return api.createLead({ customerId: c.id, title: first ? first.text.slice(0, 60) : 'New enquiry', source: conv.channel === 'email' ? 'Email' : conv.channel === 'website' ? 'Website' : 'WhatsApp', value: 0, createdBy: 'human', conversationId: id, ownerId: getCurrentUser(conv.orgId).id })
    },

    dispatch: (trigger, orgId, ctx, to) => {
      if (depth >= 2) return
      const kind = { 'lead.created': 'trigger.new_lead', 'lead.status_changed': 'trigger.status_changed', 'conversation.created': 'trigger.new_conversation', 'customer.created': 'trigger.new_customer' }[trigger]
      const matches = get().workflows.filter((w) => w.orgId === orgId && w.status === 'active' && w.nodes.some((n) => n.type === 'trigger' && n.data.kind === kind && (kind !== 'trigger.status_changed' || n.data.params.to === to)))
      depth++
      try { matches.forEach((w) => executeWorkflow(api as DbApi, w, ctx)) } finally { depth-- }
    },
    saveRun: (run, wf, actor) => {
      push('runs', run)
      const dur = (run.completedAt ?? Date.now()) - run.startedAt
      if (run.status === 'completed') api.emitEvent(run.orgId, 'workflow.completed', run.id, { workflowId: wf.id, durationMs: dur })
      if (run.status === 'failed') {
        api.emitEvent(run.orgId, 'workflow.failed', run.id, { workflowId: wf.id, durationMs: dur })
        api.addNotification(run.orgId, { type: 'workflow_failed', title: 'Workflow failed', body: `${wf.name} failed at “${run.steps.at(-1)?.label}”.`, href: `/app/flows/runs/${run.id}` })
      }
      const verb = { completed: 'completed', failed: 'failed', waiting: 'is waiting', running: 'started' }[run.status]
      api.log({ orgId: run.orgId, actor, type: 'workflow', text: `${wf.name} ${verb}`, leadId: run.leadId, customerId: run.customerId, conversationId: run.conversationId, workflowId: wf.id, runId: run.id })
    },
    triggerWorkflow: (workflowId, ctx) => {
      const wf = get().workflows.find((w) => w.id === workflowId); if (!wf) return
      const run = executeWorkflow(api as DbApi, wf, { triggeredBy: 'Manual run', ...ctx })
      api.log({ orgId: wf.orgId, actor: meActor(wf.orgId), type: 'workflow', text: `triggered ${wf.name} manually`, leadId: ctx.leadId, workflowId: wf.id, runId: run.id }, { action: 'workflow.triggered', entityType: 'workflow', entityId: wf.id, entityLabel: wf.name })
      return run
    },
    createWorkflow: (w) => {
      const wf: Workflow = { id: newId('wf'), orgId: sessionOrg(), status: 'draft', updatedAt: Date.now(), ...w }
      push('workflows', wf)
      api.log({ orgId: wf.orgId, actor: meActor(wf.orgId), type: 'workflow', text: `created workflow ${wf.name}`, workflowId: wf.id }, { action: 'workflow.created', entityType: 'workflow', entityId: wf.id, entityLabel: wf.name })
      return wf
    },
    updateWorkflow: (id, patch) => {
      const wf = get().workflows.find((w) => w.id === id); if (!wf) return
      patchIn('workflows', id, { ...patch, updatedAt: Date.now() })
      api.log({ orgId: wf.orgId, actor: meActor(wf.orgId), type: 'workflow', text: patch.status && patch.status !== wf.status ? `set ${wf.name} to ${patch.status}` : `updated workflow ${wf.name}`, workflowId: id }, { action: 'workflow.updated', entityType: 'workflow', entityId: id, entityLabel: wf.name, previous: patch.status ? cap(wf.status) : undefined, next: patch.status ? cap(patch.status) : undefined })
    },
    deleteWorkflow: (id) => {
      const wf = get().workflows.find((w) => w.id === id); if (!wf) return
      bump({ workflows: get().workflows.filter((w) => w.id !== id) })
      api.log({ orgId: wf.orgId, actor: meActor(wf.orgId), type: 'workflow', text: `deleted workflow ${wf.name}` }, { action: 'workflow.deleted', entityType: 'workflow', entityId: id, entityLabel: wf.name })
    },
    updateAgent: (id, patch) => {
      const a = get().agents.find((x) => x.id === id); if (!a) return
      patchIn('agents', id, { ...patch, updatedAt: Date.now() })
      api.log({ orgId: a.orgId, actor: meActor(a.orgId), type: 'note', text: `updated agent ${a.name}` }, { action: 'agent.updated', entityType: 'agent', entityId: id, entityLabel: a.name, previous: patch.status ? cap(a.status) : undefined, next: patch.status ? cap(patch.status) : undefined })
    },
    createAgent: (a) => {
      const base = get().agents.find((x) => x.orgId === sessionOrg())!
      const agent: Agent = { ...base, ...a, id: newId('agt'), orgId: sessionOrg(), status: 'draft', behaviors: [], workflowIds: [], updatedAt: Date.now() }
      push('agents', agent)
      api.log({ orgId: agent.orgId, actor: meActor(agent.orgId), type: 'note', text: `created agent ${agent.name}` }, { action: 'agent.created', entityType: 'agent', entityId: agent.id, entityLabel: agent.name })
      return agent
    },
    addKnowledge: (i) => {
      const k: KnowledgeItem = { id: newId('kn'), orgId: sessionOrg(), status: 'processing', updatedAt: Date.now(), sizeLabel: i.type === 'url' ? 'Crawling…' : '—', ...i }
      push('knowledge', k)
      setTimeout(() => patchIn('knowledge', k.id, { status: 'ready', updatedAt: Date.now(), sizeLabel: i.type === 'url' ? '14 pages' : i.type === 'faq' ? '12 items' : '0.8 MB' }), 2500)
      return k
    },
    retryKnowledge: (id) => {
      patchIn('knowledge', id, { status: 'processing', error: undefined, updatedAt: Date.now() })
      setTimeout(() => patchIn('knowledge', id, { status: 'ready', sizeLabel: '9 pages', updatedAt: Date.now() }), 2500)
    },
    addNotification: (orgId, n) => push('notifications', { id: newId('ntf'), orgId, at: Date.now(), read: false, ...n }),
    markNotificationRead: (id) => patchIn('notifications' as never, id, { read: true } as never),
    markAllNotificationsRead: (orgId) => bump({ notifications: get().notifications.map((n) => (n.orgId === orgId ? { ...n, read: true } : n)) }),
    reset: () => { try { sessionStorage.removeItem(KEY) } catch { /* ignore */ } set({ ...buildSnapshot(), rev: get().rev + 1 }) },
  }
  return { ...loadSnapshot(), ...api }
})

let saveTimer: ReturnType<typeof setTimeout> | undefined
useDb.subscribe((s) => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => { try { sessionStorage.setItem(KEY, JSON.stringify(Object.fromEntries(SNAP_KEYS.map((k) => [k, s[k]])))) } catch { /* storage full or unavailable */ } }, 500)
})

export const getUserName = (id?: string) => (id ? USERS.find((u) => u.id === id)?.name ?? id : 'Unassigned')

export const leadStatusLabel = (s: LeadStatus) => cap(s)
