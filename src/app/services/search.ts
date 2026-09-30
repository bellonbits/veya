import { useDb } from '../store/db'
import { matches, orgUsers } from './common'

export interface SearchHit { type: 'Customers' | 'Leads' | 'Companies' | 'Conversations' | 'Workflows' | 'Tasks'; id: string; title: string; subtitle: string; href: string }

/* GET /api/v1/search?q= — grouped client-side by `type` */
export async function globalSearch(orgId: string, q: string): Promise<SearchHit[]> {
  if (!q.trim()) return []
  const s = useDb.getState()
  const cust = new Map(s.customers.map((c) => [c.id, c]))
  const hits: SearchHit[] = []
  s.customers.filter((c) => c.orgId === orgId && matches(q, c.name, c.email, c.phone)).slice(0, 5).forEach((c) => hits.push({ type: 'Customers', id: c.id, title: c.name, subtitle: c.location, href: `/app/crm/contacts/${c.id}` }))
  s.leads.filter((l) => l.orgId === orgId && matches(q, cust.get(l.customerId)?.name, l.title, `#${l.number}`)).slice(0, 5).forEach((l) => hits.push({ type: 'Leads', id: l.id, title: `${cust.get(l.customerId)?.name} — ${l.title.split(' — ')[0]}`, subtitle: `Lead #${l.number} · ${l.status}`, href: `/app/crm/leads/${l.id}` }))
  s.companies.filter((c) => c.orgId === orgId && matches(q, c.name, c.industry)).slice(0, 4).forEach((c) => hits.push({ type: 'Companies', id: c.id, title: c.name, subtitle: c.industry, href: `/app/crm/companies/${c.id}` }))
  s.conversations.filter((c) => c.orgId === orgId && matches(q, cust.get(c.customerId)?.name)).slice(0, 4).forEach((c) => hits.push({ type: 'Conversations', id: c.id, title: `${cust.get(c.customerId)?.name} — ${c.channel === 'whatsapp' ? 'WhatsApp' : c.channel[0].toUpperCase() + c.channel.slice(1)}`, subtitle: c.status, href: `/app/inbox/${c.id}` }))
  s.workflows.filter((w) => w.orgId === orgId && matches(q, w.name, w.description)).slice(0, 4).forEach((w) => hits.push({ type: 'Workflows', id: w.id, title: w.name, subtitle: w.status, href: `/app/flows/${w.id}` }))
  s.tasks.filter((t) => t.orgId === orgId && matches(q, t.title)).slice(0, 4).forEach((t) => hits.push({ type: 'Tasks', id: t.id, title: t.title, subtitle: t.status, href: '/app/crm/tasks' }))
  return hits
}
export const teamOf = orgUsers
