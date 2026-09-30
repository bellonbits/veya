import { useDb } from '../store/db'
import type { Activity, Company, Conversation, Customer, Lead, ListQuery, Page, Task, User, Workflow, WorkflowRun } from '../types'
import { DAY } from '../lib/format'
import { matches, notFound, orgUsers, paginate, sortBy, userById } from './common'

const S = () => useDb.getState()

/* GET /api/v1/leads */
export interface LeadRow extends Lead { customerName: string; companyName?: string; ownerName?: string }
export async function listLeads(orgId: string, q: ListQuery = {}): Promise<Page<LeadRow> & { facets: Record<string, number> }> {
  const s = S()
  const cust = new Map(s.customers.map((c) => [c.id, c])), comp = new Map(s.companies.map((c) => [c.id, c]))
  const all: LeadRow[] = s.leads.filter((l) => l.orgId === orgId).map((l) => ({
    ...l, customerName: cust.get(l.customerId)?.name ?? '—', companyName: l.companyId ? comp.get(l.companyId)?.name : undefined, ownerName: userById(l.ownerId)?.name,
  }))
  const from = q.from ? new Date(String(q.from)).getTime() : 0
  const to = q.to ? new Date(String(q.to)).getTime() + DAY : Infinity
  const filtered = all.filter((l) =>
    (!q.status || l.status === q.status) && (!q.owner || (q.owner === 'none' ? !l.ownerId : l.ownerId === q.owner)) && (!q.source || l.source === q.source) &&
    l.createdAt >= from && l.createdAt < to && (!q.minValue || l.value >= Number(q.minValue)) && matches(q.q as string, l.customerName, l.title, l.companyName, `#${l.number}`))
  const facets: Record<string, number> = {}
  all.forEach((l) => { facets[l.status] = (facets[l.status] ?? 0) + 1 })
  return { ...paginate(sortBy(filtered, q, 'createdAt', { customerName: (l) => l.customerName, ownerName: (l) => l.ownerName ?? '' }), q), facets }
}

export interface LeadDetail {
  lead: Lead; customer: Customer; company?: Company; owner?: User; conversations: Conversation[]
  tasks: Task[]; runs: (WorkflowRun & { workflowName: string })[]; activities: Activity[]
}
/* GET /api/v1/leads/{id} */
export async function getLead(orgId: string, id: string): Promise<LeadDetail> {
  const s = S()
  const lead = s.leads.find((l) => l.id === id && l.orgId === orgId)
  if (!lead) throw notFound('Lead')
  const wfName = new Map(s.workflows.map((w) => [w.id, w.name]))
  return {
    lead, customer: s.customers.find((c) => c.id === lead.customerId)!, company: s.companies.find((c) => c.id === lead.companyId), owner: userById(lead.ownerId),
    conversations: s.conversations.filter((c) => c.leadId === id || (c.customerId === lead.customerId && !c.leadId)).sort((a, b) => b.lastMessageAt - a.lastMessageAt),
    tasks: s.tasks.filter((t) => t.leadId === id).sort((a, b) => a.dueAt - b.dueAt),
    runs: s.runs.filter((r) => r.leadId === id).map((r) => ({ ...r, workflowName: wfName.get(r.workflowId) ?? 'Workflow' })).sort((a, b) => b.startedAt - a.startedAt),
    activities: s.activities.filter((a) => a.leadId === id).sort((a, b) => b.at - a.at),
  }
}

export const pipelineLeads = async (orgId: string, owner?: string) => (await listLeads(orgId, { pageSize: 100, owner, sort: 'lastActivityAt' })).items
export async function pipelineAll(orgId: string, owner?: string): Promise<LeadRow[]> {
  const out: LeadRow[] = []
  for (let page = 1; ; page++) {
    const r = await listLeads(orgId, { page, pageSize: 100, owner, sort: 'lastActivityAt' })
    out.push(...r.items)
    if (out.length >= r.total) return out
  }
}

/* GET /api/v1/customers */
export interface ContactRow extends Customer { companyName?: string; ownerName?: string; openLeads: number }
export async function listContacts(orgId: string, q: ListQuery = {}): Promise<Page<ContactRow>> {
  const s = S()
  const comp = new Map(s.companies.map((c) => [c.id, c.name]))
  const rows: ContactRow[] = s.customers.filter((c) => c.orgId === orgId).map((c) => ({
    ...c, companyName: c.companyId ? comp.get(c.companyId) : undefined, ownerName: userById(c.ownerId)?.name,
    openLeads: s.leads.filter((l) => l.customerId === c.id && l.status !== 'won' && l.status !== 'lost').length,
  }))
  const f = rows.filter((c) => (!q.status || c.status === q.status) && (!q.owner || c.ownerId === q.owner) && matches(q.q as string, c.name, c.email, c.phone, c.companyName))
  return paginate(sortBy(f, q, 'lastInteractionAt', { companyName: (c) => c.companyName ?? '', ownerName: (c) => c.ownerName ?? '' }), q)
}
export interface ContactDetail { customer: Customer; company?: Company; owner?: User; leads: Lead[]; conversations: Conversation[]; tasks: Task[]; activities: Activity[]; notes: Activity[] }
/* GET /api/v1/customers/{id} */
export async function getContact(orgId: string, id: string): Promise<ContactDetail> {
  const s = S()
  const customer = s.customers.find((c) => c.id === id && c.orgId === orgId)
  if (!customer) throw notFound('Contact')
  const activities = s.activities.filter((a) => a.customerId === id).sort((a, b) => b.at - a.at)
  return {
    customer, company: s.companies.find((c) => c.id === customer.companyId), owner: userById(customer.ownerId),
    leads: s.leads.filter((l) => l.customerId === id).sort((a, b) => b.createdAt - a.createdAt),
    conversations: s.conversations.filter((c) => c.customerId === id).sort((a, b) => b.lastMessageAt - a.lastMessageAt),
    tasks: s.tasks.filter((t) => t.customerId === id).sort((a, b) => a.dueAt - b.dueAt), activities, notes: activities.filter((a) => a.type === 'note' && a.text.startsWith('added a note')),
  }
}

export interface CompanyRow extends Company { contacts: number; openOpportunities: number; totalValue: number; lastActivity: number }
export async function listCompanies(orgId: string, q: ListQuery = {}): Promise<Page<CompanyRow>> {
  const s = S()
  const rows: CompanyRow[] = s.companies.filter((c) => c.orgId === orgId).map((c) => {
    const leads = s.leads.filter((l) => l.companyId === c.id)
    const open = leads.filter((l) => l.status !== 'won' && l.status !== 'lost')
    return { ...c, contacts: s.customers.filter((x) => x.companyId === c.id).length, openOpportunities: open.length, totalValue: open.reduce((a, l) => a + l.value, 0), lastActivity: Math.max(0, ...leads.map((l) => l.lastActivityAt)) }
  }).filter((c) => matches(q.q as string, c.name, c.industry, c.location))
  return paginate(sortBy(rows, q, 'totalValue'), q)
}
export interface CompanyDetail { company: Company; contacts: Customer[]; leads: Lead[]; activities: Activity[] }
export async function getCompany(orgId: string, id: string): Promise<CompanyDetail> {
  const s = S()
  const company = s.companies.find((c) => c.id === id && c.orgId === orgId)
  if (!company) throw notFound('Company')
  const leads = s.leads.filter((l) => l.companyId === id)
  return { company, contacts: s.customers.filter((c) => c.companyId === id), leads, activities: s.activities.filter((a) => leads.some((l) => l.id === a.leadId)).sort((a, b) => b.at - a.at).slice(0, 15) }
}

/* GET /api/v1/tasks */
export interface TaskRow extends Task { assigneeName?: string; leadTitle?: string; customerName?: string; leadNumber?: number }
export async function listTasks(orgId: string, q: ListQuery = {}): Promise<{ items: TaskRow[]; counts: Record<string, number> }> {
  const s = S(), now = Date.now(), sod = new Date(now).setHours(0, 0, 0, 0)
  const rows: TaskRow[] = s.tasks.filter((t) => t.orgId === orgId).map((t) => {
    const l = s.leads.find((x) => x.id === t.leadId)
    return { ...t, assigneeName: userById(t.assigneeId)?.name, leadTitle: l?.title, leadNumber: l?.number, customerName: s.customers.find((c) => c.id === (t.customerId ?? l?.customerId))?.name }
  })
  const inView = (t: TaskRow, v: string) => v === 'all' ? true : v === 'done' ? t.status === 'done' : t.status === 'open' && (v === 'overdue' ? t.dueAt < sod : v === 'today' ? t.dueAt >= sod && t.dueAt < sod + DAY : v === 'upcoming' ? t.dueAt >= sod + DAY : true)
  const counts = Object.fromEntries(['all', 'today', 'upcoming', 'overdue', 'done'].map((v) => [v, rows.filter((t) => inView(t, v)).length]))
  const view = (q.view as string) || 'all'
  const items = rows.filter((t) => inView(t, view) && (!q.assignee || t.assigneeId === q.assignee) && matches(q.q as string, t.title, t.customerName))
  return { items: sortBy(items, { sort: 'dueAt', order: 'asc', ...q }, 'dueAt'), counts }
}

export const listTeam = async (orgId: string) => orgUsers(orgId)
export type { Workflow }
