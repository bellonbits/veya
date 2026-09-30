import { create } from 'zustand'
import { useDb } from './db'
import { useSession } from './session'

export interface StoryStep { id: string; label: string; detail: string; done: boolean; href?: string }
interface StoryState {
  running: boolean; steps: StoryStep[]; customerName?: string; leadId?: string; conversationId?: string; dismissed: boolean
  start: () => void; dismiss: () => void
}

const POOL = [['Lydia Achieng', '+254 711 902 344'], ['Kelvin Odhiambo', '+254 722 813 605'], ['Wambui Njoroge', '+254 733 120 987'], ['Moses Barasa', '+254 700 471 220'], ['Halima Abdi', '+254 745 318 776']]
let round = 0
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const blank = (): StoryStep[] => [
  { id: 'customer', label: 'Customer writes on WhatsApp', detail: '“Hi, I’m looking for a 2 bedroom apartment in Kilimani.”', done: false },
  { id: 'agent1', label: 'VEYA Agent asks for budget', detail: 'Creates the customer and conversation, starts qualification.', done: false },
  { id: 'answers', label: 'Customer answers', detail: 'Budget KES 80,000 · furnished.', done: false },
  { id: 'lead', label: 'Lead created and CRM updated', detail: 'Qualification fields extracted from the conversation.', done: false },
  { id: 'flow', label: 'Workflow runs', detail: 'New Lead Qualification scores, assigns a rep and notifies the team.', done: false },
  { id: 'task', label: 'Follow-up task created', detail: 'Assigned rep is reminded to call within 24 hours.', done: false },
  { id: 'analytics', label: 'Dashboard and Analytics update', detail: 'Lead counts, pipeline and automation runs now include this lead.', done: false, href: '/app/analytics' },
]

export const useStory = create<StoryState>((set, get) => {
  const mark = (id: string, patch: Partial<StoryStep> = {}) => set((s) => ({ steps: s.steps.map((x) => (x.id === id ? { ...x, done: true, ...patch } : x)) }))
  return {
    running: false, steps: [], dismissed: false,
    dismiss: () => set({ dismissed: true }),
    start: () => {
      if (get().running) return
      set({ running: true, dismissed: false, steps: blank(), leadId: undefined, conversationId: undefined })
      const orgId = useSession.getState().orgId
      const db = useDb.getState()
      const [name, phone] = POOL[round++ % POOL.length]
      ;(async () => {
        const agent = db.agents.find((a) => a.orgId === orgId && a.status === 'active')
        const c = db.createCustomer({ name, phone, location: 'Nairobi', email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.co.ke`, tags: ['whatsapp'] }, { kind: 'system', name: 'VEYA' })
        const conv = db.createConversation(c.id, 'whatsapp', { agentId: agent?.id, unread: 1 })
        useDb.getState().sendMessage(conv.id, { text: "Hi, I'm looking for a 2 bedroom apartment in Kilimani.", author: 'customer' })
        set({ customerName: name, conversationId: conv.id })
        mark('customer', { href: `/app/inbox/${conv.id}` })
        await wait(1300)
        useDb.getState().sendMessage(conv.id, { text: `Hello ${name.split(' ')[0]}! Happy to help. What is your approximate monthly budget?`, author: 'ai' })
        mark('agent1', { href: `/app/crm/contacts/${c.id}` })
        await wait(1500)
        useDb.getState().sendMessage(conv.id, { text: '80,000.', author: 'customer' })
        await wait(900)
        useDb.getState().sendMessage(conv.id, { text: 'Would you prefer furnished or unfurnished?', author: 'ai' })
        await wait(1300)
        useDb.getState().sendMessage(conv.id, { text: 'Furnished.', author: 'customer' })
        mark('answers')
        await wait(1200)
        const lead = useDb.getState().createLead({
          customerId: c.id, title: '2-bedroom apartment — Kilimani', source: 'WhatsApp', value: 960_000, createdBy: 'ai', conversationId: conv.id, score: 52,
          qualification: { Budget: 'KES 80,000 / month', 'Product interest': '2-bedroom apartment', Location: 'Kilimani, Nairobi', Furnishing: 'Furnished', Urgency: 'This month' },
        }, { kind: 'ai', name: agent?.name ?? 'VEYA Agent' })
        mark('lead', { href: `/app/crm/leads/${lead.id}` })
        set({ leadId: lead.id })
        await wait(500)
        const st = useDb.getState()
        const run = st.runs.find((r) => r.leadId === lead.id)
        mark('flow', { href: run ? `/app/flows/runs/${run.id}` : '/app/flows/runs', detail: run ? `${st.workflows.find((w) => w.id === run.workflowId)?.name}: ${run.steps.length} steps, ${run.status}.` : 'No active workflow matched this trigger.' })
        const task = st.tasks.find((t) => t.leadId === lead.id)
        mark('task', { href: '/app/crm/tasks', detail: task ? `“${task.title}”` : 'No follow-up task was created by the active workflows.' })
        useDb.getState().sendMessage(conv.id, { text: "Thanks! I've noted 2-bedroom · Kilimani · furnished · about KES 80,000. A sales representative will be in touch shortly.", author: 'ai' })
        await wait(400)
        mark('analytics')
        set({ running: false })
      })().catch(() => set({ running: false }))
    },
  }
})
