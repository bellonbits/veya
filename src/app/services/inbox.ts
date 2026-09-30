import { useDb } from '../store/db'
import type { Activity, Conversation, Customer, Lead, ListQuery, Message, Task, User, Company } from '../types'
import { matches, notFound, userById } from './common'

const S = () => useDb.getState()

export interface ConversationRow extends Conversation { customerName: string; lastMessage: string; lastAuthor: Message['author']; assigneeName?: string }
/* GET /api/v1/conversations */
export async function listConversations(orgId: string, q: ListQuery = {}): Promise<{ items: ConversationRow[]; counts: Record<string, number> }> {
  const s = S()
  const cust = new Map(s.customers.map((c) => [c.id, c]))
  const last = new Map<string, Message>()
  s.messages.forEach((m) => { if (!m.note) { const p = last.get(m.conversationId); if (!p || p.at < m.at) last.set(m.conversationId, m) } })
  const rows: ConversationRow[] = s.conversations.filter((c) => c.orgId === orgId).map((c) => ({
    ...c, customerName: cust.get(c.customerId)?.name ?? '—', lastMessage: last.get(c.id)?.text ?? '', lastAuthor: last.get(c.id)?.author ?? 'customer', assigneeName: userById(c.assigneeId)?.name,
  }))
  const f = (filter: string, c: ConversationRow) => filter === 'all' ? c.status !== 'closed' : filter === 'unread' ? c.unread > 0 : filter === 'assigned' ? !!c.assigneeId && c.status !== 'closed' : filter === 'unassigned' ? !c.assigneeId && c.status !== 'closed'
    : filter === 'ai' ? c.handledBy === 'ai' && c.status !== 'closed' : filter === 'human' ? c.handledBy === 'human' && c.status !== 'closed' : filter === 'closed' ? c.status === 'closed' : true
  const counts = Object.fromEntries(['all', 'unread', 'assigned', 'unassigned', 'ai', 'human', 'closed'].map((k) => [k, rows.filter((c) => f(k, c)).length]))
  const filter = (q.filter as string) || 'all'
  const items = rows.filter((c) => f(filter, c) && (!q.channel || c.channel === q.channel) && matches(q.q as string, c.customerName, c.lastMessage)).sort((a, b) => b.lastMessageAt - a.lastMessageAt)
  return { items, counts }
}

export interface ConversationDetail {
  conversation: Conversation; messages: Message[]; customer: Customer; company?: Company; lead?: Lead; assignee?: User
  openTasks: Task[]; otherConversations: Conversation[]; timeline: Activity[]; agentName?: string
}
/* GET /api/v1/conversations/{id} */
export async function getConversation(orgId: string, id: string): Promise<ConversationDetail> {
  const s = S()
  const conversation = s.conversations.find((c) => c.id === id && c.orgId === orgId)
  if (!conversation) throw notFound('Conversation')
  const customer = s.customers.find((c) => c.id === conversation.customerId)!
  return {
    conversation, customer, company: s.companies.find((c) => c.id === customer.companyId), lead: s.leads.find((l) => l.id === conversation.leadId), assignee: userById(conversation.assigneeId),
    messages: s.messages.filter((m) => m.conversationId === id).sort((a, b) => a.at - b.at),
    openTasks: s.tasks.filter((t) => (t.customerId === customer.id || t.leadId === conversation.leadId) && t.status === 'open'),
    otherConversations: s.conversations.filter((c) => c.customerId === customer.id && c.id !== id).sort((a, b) => b.lastMessageAt - a.lastMessageAt).slice(0, 4),
    timeline: s.activities.filter((a) => a.customerId === customer.id).sort((a, b) => b.at - a.at).slice(0, 12),
    agentName: s.agents.find((a) => a.id === conversation.agentId)?.name,
  }
}
