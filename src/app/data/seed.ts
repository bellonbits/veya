import type {
  Activity, Agent, Actor, AuditEntry, Channel, Company, Conversation, Customer, KnowledgeItem, Lead, LeadSource, LeadStatus,
  Message, Notification, Organization, PlatformEvent, Role, RunStep, Task, User, Workflow, WorkflowRun,
} from '../types'
import { FUNNEL_ORDER } from '../types'
import { DAY, HOUR, MIN, cap, channelName } from '../lib/format'
import { rng, type Rng } from '../lib/rng'
import { appointmentReminder, inactiveLeadFollowUp, leadAssignment, newLeadQualification, viewingFollowUp } from './workflows'

export interface Snapshot {
  customers: Customer[]; companies: Company[]; leads: Lead[]; conversations: Conversation[]; messages: Message[]
  tasks: Task[]; activities: Activity[]; audit: AuditEntry[]; agents: Agent[]; knowledge: KnowledgeItem[]
  workflows: Workflow[]; runs: WorkflowRun[]; notifications: Notification[]; events: PlatformEvent[]
}

export const ORGS: Organization[] = [
  { id: 'org_npp', name: 'Nairobi Prime Properties', slug: 'nairobi-prime', industry: 'Real estate', plan: 'Growth', region: 'Nairobi, Kenya' },
  { id: 'org_shc', name: 'Savanna Health Clinics', slug: 'savanna-health', industry: 'Healthcare', plan: 'Starter', region: 'Kisumu, Kenya' },
  { id: 'org_cfr', name: 'Coastline Freight', slug: 'coastline-freight', industry: 'Logistics', plan: 'Scale', region: 'Mombasa, Kenya' },
]

const team = (org: string, list: [string, string, Role, string][]): User[] =>
  list.map(([name, title, role, email], i) => ({ id: `${org}_u${i + 1}`, orgId: org, name, title, role, email, hue: (i * 67 + 250) % 360 }))

export const USERS: User[] = [
  ...team('org_npp', [
    ['Grace Njeri', 'Founder', 'owner', 'grace@nairobiprime.example'], ['Daniel Kiptoo', 'Operations', 'admin', 'daniel@nairobiprime.example'],
    ['Faith Chebet', 'Sales lead', 'manager', 'faith@nairobiprime.example'], ['Kevin Mutua', 'Sales agent', 'agent', 'kevin@nairobiprime.example'],
    ['Mercy Atieno', 'Sales agent', 'agent', 'mercy@nairobiprime.example'], ['Ali Farah', 'Finance', 'viewer', 'ali@nairobiprime.example'],
  ]),
  ...team('org_shc', [
    ['Grace Njeri', 'Director', 'owner', 'grace@savanna.example'], ['Dr. Amos Ouma', 'Clinic manager', 'manager', 'amos@savanna.example'], ['Linet Awuor', 'Front desk', 'agent', 'linet@savanna.example'],
  ]),
  ...team('org_cfr', [
    ['Grace Njeri', 'Partner', 'admin', 'grace@coastline.example'], ['Hassan Bakari', 'Dispatch lead', 'manager', 'hassan@coastline.example'], ['Zuhura Salim', 'Account exec', 'agent', 'zuhura@coastline.example'],
  ]),
]

const FIRST = ['John', 'Amina', 'David', 'Brian', 'Sarah', 'Faith', 'Kelvin', 'Naomi', 'Samuel', 'Wambui', 'Hassan', 'Cynthia', 'Dennis', 'Achieng', 'Ibrahim', 'Lucy', 'Joseph', 'Esther', 'Mwikali', 'Otieno', 'Zawadi', 'Peter', 'Halima', 'Victor', 'Rehema', 'Collins', 'Nyambura', 'Abdi', 'Lydia', 'Moses']
const LAST = ['Mwangi', 'Hassan', 'Otieno', 'Kamau', 'Wanjiku', 'Njoroge', 'Odhiambo', 'Mutua', 'Kiptoo', 'Abdi', 'Chebet', 'Omondi', 'Wafula', 'Mohamed', 'Karanja', 'Nyambura', 'Kilonzo', 'Barasa', 'Achieng', 'Waweru', 'Ndung’u', 'Juma']
const AREAS = ['Kilimani, Nairobi', 'Westlands, Nairobi', 'Lavington, Nairobi', 'Karen, Nairobi', 'Ruaka, Kiambu', 'Kitengela', 'Syokimau', 'Runda, Nairobi', 'Thika Road, Nairobi', 'Nyali, Mombasa']
const SOURCES: [LeadSource, number][] = [['WhatsApp', 38], ['Website', 22], ['Referral', 14], ['Facebook Ads', 14], ['Email', 6], ['Walk-in', 6]]
const CHANNEL_OF: Partial<Record<LeadSource, Channel>> = { WhatsApp: 'whatsapp', Website: 'website', Email: 'email', 'Facebook Ads': 'whatsapp' }

interface Profile {
  orgId: string; customers: number; leads: number; runs: number; seedNum: number
  titles: [string, number, number][]; companies: [string, string][]; agentName: string
  workflows: { name: string; description: string; status: Workflow['status']; def: () => { nodes: Workflow['nodes']; edges: Workflow['edges'] } }[]
  agentReplies: string[]
}

const PROFILES: Profile[] = [
  {
    orgId: 'org_npp', customers: 62, leads: 104, runs: 230, seedNum: 7, agentName: 'Nairobi Prime Assistant',
    titles: [['2-bedroom apartment — Kilimani', 600_000, 1_400_000], ['Commercial office — Westlands', 1_800_000, 6_000_000], ['Land inquiry — Kitengela', 2_500_000, 14_000_000],
      ['Property management — Lavington', 400_000, 1_200_000], ['Short-term rental — Kilimani', 250_000, 700_000], ['3-bedroom maisonette — Runda', 1_500_000, 3_600_000], ['Studio — Ruaka', 220_000, 480_000]],
    companies: [['Hassan & Partners Advocates', 'Legal'], ['Kamau Holdings', 'Investment'], ['Ridgeway Logistics', 'Logistics'], ['Bluepeak Digital', 'Technology'], ['Savannah Coffee Co.', 'Food & beverage'], ['Umoja Cooperative', 'Finance'], ['Tembo Engineering', 'Construction'], ['Mara Wellness', 'Health']],
    agentReplies: ['What is your approximate monthly budget?', 'Would you prefer furnished or unfurnished?', 'Which area do you prefer?', 'When would you like to move?'],
    workflows: [
      { name: 'New Lead Qualification', description: 'Create the CRM record, score the lead with VEYA Agent, then assign a rep or nurture.', status: 'active', def: newLeadQualification },
      { name: 'Property Viewing Follow-up', description: 'Offer a viewing at Proposal and chase when there is no response.', status: 'active', def: viewingFollowUp },
      { name: 'Inactive Lead Follow-up', description: 'Daily check-in with leads that have gone quiet.', status: 'active', def: inactiveLeadFollowUp },
      { name: 'Appointment Reminder', description: 'Reminders for scheduled viewings, during business hours only.', status: 'paused', def: appointmentReminder },
      { name: 'Lead Assignment', description: 'Assign new leads to the least busy representative.', status: 'draft', def: leadAssignment },
    ],
  },
  {
    orgId: 'org_shc', customers: 14, leads: 22, runs: 24, seedNum: 21,
    titles: [['General consultation', 2_000, 6_000], ['Dental check-up', 3_000, 12_000], ['Maternity package', 60_000, 150_000], ['Corporate wellness plan', 180_000, 900_000]],
    companies: [['Lakeview Schools', 'Education'], ['Nyanza Sugar', 'Manufacturing']], agentName: 'Savanna Front Desk',
    agentReplies: ['Which service are you interested in?', 'Do you have insurance cover?', 'What day works best for you?'],
    workflows: [
      { name: 'New Lead Qualification', description: 'Qualify enquiries and route to the front desk.', status: 'active', def: newLeadQualification },
      { name: 'Appointment Reminder', description: 'Send reminders before clinic appointments.', status: 'active', def: appointmentReminder },
    ],
  },
  {
    orgId: 'org_cfr', customers: 16, leads: 26, runs: 30, seedNum: 33,
    titles: [['Container haulage — Mombasa to Nairobi', 300_000, 1_200_000], ['Warehousing — 500 pallets', 800_000, 2_400_000], ['Customs clearance retainer', 150_000, 600_000], ['Cross-border freight — Kampala', 500_000, 2_000_000]],
    companies: [['Kilindini Traders', 'Import/export'], ['Pwani Fresh Produce', 'Agriculture'], ['Bandari Steel', 'Manufacturing']], agentName: 'Coastline Quote Assistant',
    agentReplies: ['What are you shipping and how much?', 'Which route do you need?', 'When should the cargo move?'],
    workflows: [
      { name: 'New Lead Qualification', description: 'Score freight enquiries and assign an account exec.', status: 'active', def: newLeadQualification },
      { name: 'Lead Assignment', description: 'Assign leads to the least busy account executive.', status: 'active', def: leadAssignment },
    ],
  },
]

function buildStepsFor(wf: Workflow, at: number, r: Rng, failAt: number | null, waitAtWait: boolean): { steps: RunStep[]; status: WorkflowRun['status']; end?: number } {
  const steps: RunStep[] = []
  const byId = new Map(wf.nodes.map((nd) => [nd.id, nd]))
  let cur: string | undefined = wf.nodes.find((nd) => nd.type === 'trigger')?.id
  let t = at
  let guard = 0
  while (cur && guard++ < 30) {
    const nd = byId.get(cur)!
    if (nd.type === 'end') break
    const dur = r.int(40, 900)
    const idx = steps.length
    if (failAt === idx) {
      steps.push({ nodeId: nd.id, label: nd.data.label, kind: nd.data.kind, status: 'failed', startedAt: t, durationMs: dur, error: nd.data.kind.includes('webhook') ? 'Webhook returned 502 Bad Gateway' : 'Timed out waiting for downstream service', input: { params: nd.data.params } })
      return { steps, status: 'failed', end: t + dur }
    }
    if (nd.data.kind === 'action.wait' && waitAtWait) {
      steps.push({ nodeId: nd.id, label: nd.data.label, kind: nd.data.kind, status: 'waiting', startedAt: t, durationMs: 0, output: { resumesAt: t + Number(nd.data.params.hours || 24) * HOUR } })
      return { steps, status: 'waiting' }
    }
    steps.push({ nodeId: nd.id, label: nd.data.label, kind: nd.data.kind, status: 'completed', startedAt: t, durationMs: dur, input: { params: nd.data.params }, output: nd.type === 'condition' ? { result: true } : { ok: true } })
    t += dur
    const outs = wf.edges.filter((ed) => ed.source === cur)
    cur = (nd.type === 'condition' ? outs.find((o) => o.sourceHandle === (r.chance(0.7) ? 'yes' : 'no')) ?? outs[0] : outs[0])?.target
  }
  return { steps, status: 'completed', end: t }
}

export function buildSnapshot(now = Date.now()): Snapshot {
  const snap: Snapshot = { customers: [], companies: [], leads: [], conversations: [], messages: [], tasks: [], activities: [], audit: [], agents: [], knowledge: [], workflows: [], runs: [], notifications: [], events: [] }
  for (const p of PROFILES) seedOrg(snap, p, now)
  return snap
}

function seedOrg(snap: Snapshot, p: Profile, now: number) {
  const r = rng(p.seedNum * 9973)
  const org = p.orgId
  const users = USERS.filter((u) => u.orgId === org)
  const sales = users.filter((u) => u.role === 'agent' || u.role === 'manager')
  let uid = 0
  const id = (pre: string) => `${pre}_${org.slice(4)}${(++uid).toString(36)}`
  const ai = (name: string): Actor => ({ kind: 'ai', name })
  const userActor = (u: User): Actor => ({ kind: 'user', id: u.id, name: u.name })
  const ev = (name: PlatformEvent['name'], at: number, entityId?: string, meta?: PlatformEvent['meta']) => snap.events.push({ id: id('ev'), orgId: org, at, name, entityId, meta })

  /* companies */
  const companies: Company[] = p.companies.map(([name, industry]) => ({
    id: id('co'), orgId: org, name, industry, website: `${name.toLowerCase().replace(/[^a-z]+/g, '')}.example`, location: r.pick(AREAS),
  }))
  snap.companies.push(...companies)

  /* customers */
  type Hand = { name: string; phone: string; location: string; tags: string[]; title: string; status: LeadStatus; source: LeadSource; owner: number; co?: number; value: number; hoursAgo: number; channel: Channel; handled: 'ai' | 'human'; unread: number; escalated?: boolean; budget: string }
  const hand: Hand[] = org !== 'org_npp' ? [] : [
    { name: 'John Mwangi', phone: '+254 712 345 678', location: 'Kilimani, Nairobi', tags: ['furnished', 'high-intent'], title: '2-bedroom apartment — Kilimani', status: 'proposal', source: 'WhatsApp', owner: 2, value: 960_000, hoursAgo: 0.2, channel: 'whatsapp', handled: 'human', unread: 0, budget: 'KES 80,000 / month' },
    { name: 'Amina Hassan', phone: '+254 722 118 904', location: 'Westlands, Nairobi', tags: ['corporate'], title: 'Commercial office — Westlands', status: 'negotiation', source: 'Website', owner: 3, co: 0, value: 4_200_000, hoursAgo: 0.8, channel: 'website', handled: 'human', unread: 0, budget: 'KES 350,000 / month' },
    { name: 'David Otieno', phone: '+254 733 407 216', location: 'Kitengela', tags: ['investor'], title: 'Land inquiry — Kitengela', status: 'qualified', source: 'WhatsApp', owner: 2, value: 6_500_000, hoursAgo: 0.1, channel: 'whatsapp', handled: 'human', unread: 2, escalated: true, budget: 'KES 6M total' },
    { name: 'Brian Kamau', phone: '+254 700 552 083', location: 'Lavington, Nairobi', tags: ['landlord'], title: 'Property management — Lavington', status: 'contacted', source: 'Email', owner: 4, co: 1, value: 780_000, hoursAgo: 3, channel: 'email', handled: 'human', unread: 0, budget: '8% of rent' },
    { name: 'Sarah Wanjiku', phone: '+254 745 660 391', location: 'Kilimani, Nairobi', tags: ['short-stay'], title: 'Short-term rental — Kilimani', status: 'new', source: 'WhatsApp', owner: -1, value: 420_000, hoursAgo: 0.04, channel: 'whatsapp', handled: 'ai', unread: 1, budget: 'KES 15,000 / night' },
  ]
  const customers: Customer[] = []
  const nameUsed = new Set<string>()
  hand.forEach((h) => {
    const created = now - r.int(2, 9) * DAY
    customers.push({ id: id('cus'), orgId: org, name: h.name, phone: h.phone, email: `${h.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.co.ke`, location: h.location, tags: h.tags, companyId: h.co !== undefined ? companies[h.co].id : undefined, ownerId: h.owner >= 0 ? users[h.owner].id : undefined, status: 'active', createdAt: created, lastInteractionAt: now - h.hoursAgo * HOUR, custom: { Budget: h.budget, 'Preferred contact': 'WhatsApp' } })
    nameUsed.add(h.name)
  })
  while (customers.length < p.customers) {
    const name = `${r.pick(FIRST)} ${r.pick(LAST)}`
    if (nameUsed.has(name)) continue
    nameUsed.add(name)
    const created = now - Math.floor(Math.pow(r.next(), 1.08) * 90 * DAY) - 3 * HOUR
    customers.push({
      id: id('cus'), orgId: org, name, phone: `+254 7${r.int(10, 49)} ${r.int(100, 999)} ${r.int(100, 999)}`, email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.co.ke`,
      location: r.pick(AREAS), tags: r.chance(0.3) ? [r.pick(['vip', 'referral', 'investor', 'returning'])] : [], companyId: r.chance(0.25) ? r.pick(companies).id : undefined,
      ownerId: r.pick(sales).id, status: 'new', createdAt: created, lastInteractionAt: created, custom: {},
    })
  }
  snap.customers.push(...customers)
  customers.forEach((c) => ev('customer.created', c.createdAt, c.id))

  /* leads */
  const agentName = p.agentName
  const leads: Lead[] = []
  const mkLead = (customer: Customer, createdAt: number, h?: Hand): Lead => {
    const t = h ? [h.title, h.value] as const : (() => { const x = r.pick(p.titles); return [x[0], Math.round(r.int(x[1], x[2]) / 1000) * 1000] as const })()
    const ageDays = (now - createdAt) / DAY
    const status: LeadStatus = h ? h.status : r.weighted<LeadStatus>(ageDays < 4
      ? [['new', 45], ['qualified', 30], ['contacted', 20], ['proposal', 5]]
      : ageDays < 20 ? [['new', 8], ['qualified', 18], ['contacted', 24], ['proposal', 18], ['negotiation', 10], ['won', 8], ['lost', 14]]
      : [['contacted', 6], ['proposal', 6], ['negotiation', 5], ['won', 30], ['lost', 40], ['qualified', 7], ['new', 6]])
    const rank = FUNNEL_ORDER.indexOf(status)
    const reached = status === 'lost' ? r.int(0, 3) : rank
    const qualifiedAt = reached >= 1 || status === 'lost' && reached >= 1 ? createdAt + r.int(2, 90) * MIN : undefined
    const closed = status === 'won' || status === 'lost'
    const source = h ? h.source : r.weighted(SOURCES)
    const owner = h ? (h.owner >= 0 ? users[h.owner].id : undefined) : status === 'new' && r.chance(0.5) ? undefined : r.pick(sales).id
    const last = h ? now - h.hoursAgo * HOUR : Math.min(now - 5 * MIN, createdAt + r.int(1, Math.max(2, Math.floor(ageDays * 0.7 + 1))) * DAY / 2)
    const nextAction = closed ? '—' : ({ new: 'Qualify via VEYA Agent', qualified: 'Assign and make first call', contacted: 'Send property shortlist', proposal: 'Confirm viewing', negotiation: 'Send final offer' } as Record<string, string>)[status] ?? 'Follow up'
    return {
      id: id('lead'), orgId: org, number: 0, customerId: customer.id, companyId: customer.companyId, title: t[0], source, ownerId: owner, status, value: t[1],
      score: reached >= 1 ? r.int(62, 96) : r.int(18, 58), createdAt, qualifiedAt, closedAt: closed ? Math.min(now - HOUR, createdAt + r.int(1, 30) * DAY) : undefined, lastActivityAt: closed ? Math.min(now - HOUR, createdAt + r.int(1, 30) * DAY) : last,
      nextAction, createdBy: source === 'WhatsApp' || source === 'Website' ? 'ai' : r.pick(['human', 'workflow']),
      qualification: { Budget: h?.budget ?? `KES ${r.int(30, 250)},000`, 'Product interest': t[0].split(' — ')[0], Location: customer.location, Urgency: r.pick(['This month', 'Within 3 months', 'Just exploring']) }, reached,
    }
  }
  hand.forEach((h, i) => leads.push(mkLead(customers[i], now - r.int(1, 6) * DAY - i * HOUR, h)))
  for (let i = 0; i < p.leads; i++) {
    const c = customers[hand.length + (i % (customers.length - hand.length))] ?? customers[0]
    const createdAt = Math.max(c.createdAt, now - Math.floor(Math.pow(r.next(), 1.04) * 90 * DAY) - 2 * HOUR)
    leads.push(mkLead(c, createdAt))
  }
  leads.sort((a, b) => a.createdAt - b.createdAt)
  const base = (org === 'org_npp' ? 1048 : 300 + p.seedNum) - leads.length
  leads.forEach((l, i) => { l.number = base + i })
  snap.leads.push(...leads)

  /* per-lead events, activities, audit */
  const custById = new Map(customers.map((c) => [c.id, c]))
  for (const l of leads) {
    const c = custById.get(l.customerId)!
    const actor: Actor = l.createdBy === 'ai' ? ai(agentName) : l.createdBy === 'workflow' ? { kind: 'workflow', name: 'New Lead Qualification' } : userActor(r.pick(sales))
    snap.activities.push({ id: id('act'), orgId: org, at: l.createdAt, type: 'lead', actor, text: `created Lead #${l.number} — ${l.title}`, leadId: l.id, customerId: c.id })
    ev('lead.created', l.createdAt, l.id, { source: l.source, value: l.value, ownerId: l.ownerId })
    if (l.qualifiedAt) ev('lead.qualified', l.qualifiedAt, l.id, { source: l.source, value: l.value, ownerId: l.ownerId })
    const stages = FUNNEL_ORDER.slice(1, l.reached + 1)
    stages.forEach((s, i) => {
      const at = l.createdAt + ((l.lastActivityAt - l.createdAt) * (i + 1)) / (stages.length + 1)
      const from = FUNNEL_ORDER[i]
      const actorU = l.ownerId ? userActor(users.find((u) => u.id === l.ownerId)!) : ai(agentName)
      snap.activities.push({ id: id('act'), orgId: org, at, type: 'status', actor: actorU, text: `moved Lead #${l.number} from ${cap(from)} → ${cap(s)}`, leadId: l.id, customerId: c.id })
      if (at > now - 6 * DAY) snap.audit.push({ id: id('aud'), orgId: org, at, actor: actorU, action: 'lead.status_changed', entityType: 'lead', entityId: l.id, entityLabel: `Lead #${l.number}`, previous: cap(from), next: cap(s) })
      ev('lead.status_changed', at, l.id, { ownerId: l.ownerId })
    })
    if (l.status === 'won') ev('lead.won', l.closedAt!, l.id, { source: l.source, value: l.value, ownerId: l.ownerId })
    if (l.status === 'lost') ev('lead.lost', l.closedAt!, l.id, { source: l.source, value: l.value, ownerId: l.ownerId })
    c.lastInteractionAt = Math.max(c.lastInteractionAt, l.lastActivityAt)
    if (l.status === 'won') c.status = 'active'
  }
  customers.forEach((c) => { if (c.status === 'new') c.status = now - c.lastInteractionAt > 35 * DAY ? 'inactive' : now - c.createdAt < 10 * DAY ? 'new' : 'active' })

  /* conversations */
  const leadByCust = new Map<string, Lead>()
  leads.forEach((l) => leadByCust.set(l.customerId, l))
  const agentId = `agt_${org.slice(4)}1`
  let convNo = org === 'org_npp' ? 2048 - 60 : 100
  const mkConv = (c: Customer, l: Lead, createdAt: number, channel: Channel, h?: Hand) => {
    const isRecent = now - createdAt < 2 * DAY
    const handled: 'ai' | 'human' = h ? h.handled : r.chance(0.72) ? 'ai' : 'human'
    const escalated = h ? !!h.escalated : handled === 'human' && r.chance(0.35)
    const unanswered = !h && r.chance(0.05)
    const firstResponseSec = unanswered ? undefined : handled === 'ai' && !escalated ? r.int(2, 9) : escalated ? r.int(180, 900) : r.int(60, 1500)
    const status: Conversation['status'] = h ? 'open' : isRecent ? (r.chance(0.7) ? 'open' : 'snoozed') : 'closed'
    const assignee = handled === 'human' ? (h ? (h.owner >= 0 ? users[h.owner].id : undefined) : l.ownerId) : undefined
    const conv: Conversation = {
      id: `conv_${++convNo}`, orgId: org, customerId: c.id, channel, status, handledBy: handled, agentId: handled === 'ai' || escalated ? agentId : undefined,
      assigneeId: escalated && h ? undefined : assignee, leadId: l.id, unread: h ? h.unread : isRecent && status === 'open' ? r.int(0, 2) : 0,
      tags: escalated ? ['escalated'] : [], createdAt, lastMessageAt: h ? now - h.hoursAgo * HOUR : createdAt + r.int(3, 40) * MIN, escalated, firstResponseSec,
    }
    snap.conversations.push(conv)
    ev('conversation.created', createdAt, conv.id, { handledBy: handled, channel, responseSec: firstResponseSec })
    if (escalated) ev('conversation.escalated', createdAt + 5 * MIN, conv.id, { reason: r.pick(['Low confidence', 'Customer asked for a human', 'Pricing negotiation', 'Complaint']) })
    if (status === 'closed') ev('conversation.closed', conv.lastMessageAt + HOUR, conv.id)
    return conv
  }
  const msg = (conv: Conversation, author: Message['author'], text: string, at: number, userId?: string) =>
    snap.messages.push({ id: id('msg'), orgId: org, conversationId: conv.id, author, text, at, userId })

  hand.forEach((h, i) => {
    const c = customers[i], l = leads[leads.findIndex((x) => x.customerId === c.id)]
    const t0 = now - h.hoursAgo * HOUR - 26 * MIN
    const conv = mkConv(c, l, t0, h.channel, h)
    l.title = h.title
    const first = c.name.split(' ')[0]
    const script: [Message['author'], string][] = ({
      'John Mwangi': [['customer', "Hi, I'm looking for a 2 bedroom apartment in Kilimani."], ['ai', `Hello ${first}! Happy to help you find a place. What is your approximate monthly budget?`], ['customer', '80,000.'], ['ai', 'Would you prefer furnished or unfurnished?'], ['customer', 'Furnished.'], ['ai', "Thanks. I've noted: 2-bedroom, Kilimani, furnished, around KES 80,000 per month. A sales representative will share matching options shortly."], ['human', 'Hi John, Faith from Nairobi Prime here. I have three furnished 2-bedrooms in Kilimani within your budget. Can I arrange viewings this Saturday?'], ['customer', 'Saturday 11am works for me.']],
      'Amina Hassan': [['customer', 'Good morning. We need about 200 sqm of office space in Westlands for a team of 18.'], ['ai', 'Good morning Amina. Thank you for reaching out. Do you have a monthly budget in mind, and when would you like to move in?'], ['customer', 'Up to KES 350,000 per month, ideally by 1st of next month.'], ['ai', 'Understood. I have passed your requirements to our commercial team.'], ['human', 'Hello Amina, Kevin here. I have two floors on Waiyaki Way that fit. I can send the lease terms today.'], ['customer', 'Please send them. Also, is parking included?']],
      'David Otieno': [['customer', 'Do you have any land in Kitengela? Around 1 acre.'], ['ai', 'Yes, we have several listings in Kitengela. What is your budget, and is it for residential or commercial use?'], ['customer', 'Residential. Around 6M. But I want to speak to a person about the title deeds first.'], ['ai', "Of course. I'm escalating this conversation to a member of our team who can discuss title verification with you."], ['customer', 'Thanks. How long will that take?'], ['customer', 'Hello? Anyone there?']],
      'Brian Kamau': [['customer', 'Hello, I own four rental units in Lavington and would like to outsource management. What are your fees?'], ['ai', "Hello Brian. Property management fees typically start at 8% of collected rent, depending on the number of units. I've shared this with a team member who will contact you."], ['human', 'Hi Brian, Mercy here. Could we schedule a call tomorrow to walk through your units and the services included?'], ['customer', 'Tomorrow at 10am works. Thanks.']],
      'Sarah Wanjiku': [['customer', 'Hi, do you manage short-term rentals in Kilimani? I have a 1 bedroom.'], ['ai', 'Hello Sarah! Yes, we do. Is the apartment furnished, and roughly what nightly rate are you targeting?']],
    } as Record<string, [Message['author'], string][]>)[h.name]
    script.forEach(([a, text], k) => msg(conv, a, text, t0 + k * 3.2 * MIN, a === 'human' ? (h.owner >= 0 ? users[h.owner].id : undefined) : undefined))
    conv.lastMessageAt = t0 + (script.length - 1) * 3.2 * MIN
    snap.activities.push({ id: id('act'), orgId: org, at: conv.lastMessageAt, type: 'conversation', actor: { kind: 'user', name: c.name }, text: `messaged on ${channelName(h.channel)}`, leadId: l.id, customerId: c.id, conversationId: conv.id })
  })
  const chanLeads = leads.filter((l) => CHANNEL_OF[l.source] && !hand.some((h) => h.name === custById.get(l.customerId)!.name) && r.chance(0.72))
  chanLeads.forEach((l) => {
    const c = custById.get(l.customerId)!
    const conv = mkConv(c, l, l.createdAt - r.int(2, 25) * MIN, CHANNEL_OF[l.source]!)
    const first = c.name.split(' ')[0], want = l.title.split(' — ')[0].toLowerCase()
    const seq: [Message['author'], string][] = [['customer', `Hi, I'm interested in ${want}.`], ['ai', `Hello ${first}! ${r.pick(p.agentReplies)}`], ['customer', l.qualification.Budget], ['ai', `Thanks, noted. ${r.pick(p.agentReplies)}`]]
    if (conv.handledBy === 'human' && conv.firstResponseSec) seq.push(['human', `Hi ${first}, thanks for your patience. I can help with that today.`])
    if (conv.firstResponseSec === undefined) seq.length = 1
    seq.forEach(([a, text], k) => msg(conv, a, text, conv.createdAt + k * 2 * MIN, a === 'human' ? l.ownerId : undefined))
    conv.lastMessageAt = conv.createdAt + (seq.length - 1) * 2 * MIN
    l.lastActivityAt = Math.max(l.lastActivityAt, conv.lastMessageAt)
  })
  snap.conversations.forEach((cv) => {
    if (cv.orgId !== org) return
    const l = leads.find((x) => x.id === cv.leadId)
    if (l) l.lastActivityAt = Math.max(l.lastActivityAt, cv.lastMessageAt)
  })

  /* tasks */
  const taskTitles = ['Follow up with {c} regarding {t}', 'Send property shortlist to {c}', 'Confirm viewing with {c}', 'Prepare lease draft for {c}', 'Call {c} to discuss pricing']
  const open = leads.filter((l) => l.status !== 'won' && l.status !== 'lost').slice(-24)
  open.forEach((l, i) => {
    const c = custById.get(l.customerId)!
    const done = r.chance(0.3)
    const due = now + r.int(-3, 6) * DAY + r.int(-6, 6) * HOUR
    const title = r.pick(taskTitles).replace('{c}', c.name.split(' ')[0]).replace('{t}', l.title.split(' — ').join(' '))
    const task: Task = { id: id('task'), orgId: org, title: i === 0 && org === 'org_npp' ? 'Follow up with John regarding Kilimani apartment' : title, assigneeId: l.ownerId ?? r.pick(sales).id, dueAt: due, priority: r.pick(['low', 'medium', 'medium', 'high']), status: done ? 'done' : 'open', leadId: l.id, customerId: c.id, completedAt: done ? due - HOUR : undefined }
    snap.tasks.push(task)
    ev('task.created', Math.min(due - 2 * DAY, now - HOUR), task.id)
    if (done) ev('task.completed', task.completedAt!, task.id)
  })

  /* agent + knowledge */
  const defaultAgent: Agent = {
    id: agentId, orgId: org, name: agentName, description: `Answers enquiries, qualifies leads and hands over to your team on ${org === 'org_npp' ? 'WhatsApp and your website' : 'WhatsApp'}.`, status: 'active',
    channels: ['whatsapp', 'website'], tone: 'friendly', language: 'English + Swahili', responseStyle: 'Short, one question at a time', identity: `You are the virtual assistant for ${ORGS.find((o) => o.id === org)!.name}, based in ${ORGS.find((o) => o.id === org)!.region}.`,
    behaviors: [
      { id: 'b1', when: 'A customer asks about pricing', then: 'Provide information from the knowledge base and ask for their budget.' },
      { id: 'b2', when: 'A customer is ready to buy or book', then: 'Create a lead and trigger New Lead Qualification.' },
      { id: 'b3', when: 'Confidence is low or the customer asks for a person', then: 'Escalate to a human and notify the team.' },
    ],
    qualification: ['Name', 'Phone', 'Email', 'Location', 'Budget', 'Product interest', 'Urgency'].map((f) => ({ field: f, enabled: !['Email'].includes(f), required: ['Name', 'Budget', 'Product interest'].includes(f) })),
    escalation: { triggers: ['Customer asks for a human', 'Confidence below threshold', 'Complaint detected', 'Negotiation on price'], teamId: users[2]?.id ?? users[0].id, notifyChannel: 'inbox', confidenceThreshold: 65 },
    workflowIds: [], updatedAt: now - 2 * DAY,
  }
  snap.agents.push(defaultAgent)
  if (org === 'org_npp') {
    snap.agents.push(
      { ...defaultAgent, id: 'agt_npp2', name: 'Viewing Scheduler', description: 'Books and confirms property viewings, then syncs to the team calendar.', status: 'paused', channels: ['whatsapp'], updatedAt: now - 9 * DAY, behaviors: defaultAgent.behaviors.slice(1, 2) },
      { ...defaultAgent, id: 'agt_npp3', name: 'Property Management Desk', description: 'Handles landlord enquiries and maintenance requests.', status: 'draft', channels: ['email'], updatedAt: now - 15 * DAY, behaviors: [] },
    )
  }
  const K: [string, KnowledgeItem['type'], KnowledgeItem['status'], string][] = org !== 'org_npp' ? [['Services and prices', 'document', 'ready', '1.2 MB'], ['Opening hours and FAQs', 'faq', 'ready', '18 items']] : [
    ['Rental pricing by neighbourhood 2026', 'document', 'ready', '2.4 MB'], ['nairobiprime.example/listings', 'url', 'ready', '112 pages'], ['Frequently asked questions', 'faq', 'ready', '34 items'],
    ['Viewing and deposit policy', 'text', 'ready', '1.1 KB'], ['Furnished apartments catalogue', 'product', 'ready', '46 items'], ['Property management services', 'service', 'ready', '8 items'],
    ['Land title verification guide', 'document', 'processing', '5.8 MB'], ['nairobiprime.example/blog', 'url', 'failed', '—'],
  ]
  K.forEach(([title, type, status, sizeLabel], i) => snap.knowledge.push({ id: id('kn'), orgId: org, agentId, title, type, status, sizeLabel, updatedAt: now - (i + 1) * 6 * HOUR - i * DAY, error: status === 'failed' ? 'The site blocked our crawler (robots.txt). Allow VEYA or upload the content instead.' : undefined }))

  /* workflows + runs */
  const wfs: Workflow[] = p.workflows.map((w, i) => ({ id: `wf_${org.slice(4)}${i + 1}`, orgId: org, name: w.name, description: w.description, status: w.status, ...w.def(), updatedAt: now - (i + 1) * 2 * DAY }))
  snap.workflows.push(...wfs)
  defaultAgent.workflowIds = [wfs[0].id]
  const active = wfs.filter((w) => w.status === 'active')
  for (let i = 0; i < p.runs; i++) {
    const wf = r.weighted(active.map((w, k) => [w, k === 0 ? 6 : 2] as const))
    const startedAt = now - Math.floor(Math.pow(r.next(), 1.05) * 90 * DAY) - 5 * MIN
    const fail = r.chance(0.035)
    const lead = leads.reduce<Lead | undefined>((best, l) => (!best || Math.abs(l.createdAt - startedAt) < Math.abs(best.createdAt - startedAt) ? l : best), undefined)
    const waiting = now - startedAt < 20 * HOUR && wf.nodes.some((nd) => nd.data.kind === 'action.wait') && r.chance(0.6)
    const b = buildStepsFor(wf, startedAt, r, fail ? r.int(1, 3) : null, waiting)
    const run: WorkflowRun = { id: id('run'), orgId: org, workflowId: wf.id, startedAt, completedAt: b.end, status: b.status, steps: b.steps, leadId: lead?.id, customerId: lead?.customerId, triggeredBy: wf.nodes[0].data.label }
    snap.runs.push(run)
    ev('workflow.started', startedAt, run.id, { workflowId: wf.id })
    if (b.status === 'completed') ev('workflow.completed', b.end!, run.id, { workflowId: wf.id, durationMs: b.end! - startedAt })
    if (b.status === 'failed') ev('workflow.failed', b.end!, run.id, { workflowId: wf.id, durationMs: b.end! - startedAt })
  }
  snap.runs.sort((a, b) => b.startedAt - a.startedAt)

  /* notifications (org-local, reference real records) */
  const mkN = (type: Notification['type'], title: string, body: string, minsAgo: number, href: string, read = false) =>
    snap.notifications.push({ id: id('ntf'), orgId: org, at: now - minsAgo * MIN, type, title, body, read, href })
  if (org === 'org_npp') {
    const conv = snap.conversations.filter((c) => c.orgId === org)
    const cv = (n: string) => conv.find((c) => custById.get(c.customerId)!.name === n)!
    const failed = snap.runs.find((x) => x.orgId === org && x.status === 'failed')
    mkN('escalation', 'AI escalation', `${agentName} escalated David Otieno — asked to discuss title deeds.`, 6, `/app/inbox/${cv('David Otieno').id}`)
    mkN('reply', 'Customer replied', 'John Mwangi: "Saturday 11am works for me."', 12, `/app/inbox/${cv('John Mwangi').id}`)
    mkN('lead', 'New lead', `${agentName} created a lead: Short-term rental — Kilimani (Sarah Wanjiku).`, 22, `/app/crm/leads/${leadByCust.get(cv('Sarah Wanjiku').customerId)!.id}`)
    if (failed) mkN('workflow_failed', 'Workflow failed', `${wfs.find((w) => w.id === failed.workflowId)!.name} failed at step "${failed.steps.at(-1)?.label}".`, 95, `/app/flows/runs/${failed.id}`)
    mkN('task_due', 'Task due today', 'Follow up with John regarding Kilimani apartment', 140, '/app/crm/tasks?view=today', true)
    mkN('assigned', 'Lead assigned to you', 'Amina Hassan — Commercial office, Westlands', 300, `/app/crm/leads/${leadByCust.get(cv('Amina Hassan').customerId)!.id}`, true)
    mkN('system', 'Knowledge source failed', 'nairobiprime.example/blog could not be crawled.', 700, '/app/agent/knowledge', true)
  } else mkN('system', 'Welcome to VEYA', 'Your workspace is ready. Connect a channel to start receiving conversations.', 60, '/app/settings/channels')
}
