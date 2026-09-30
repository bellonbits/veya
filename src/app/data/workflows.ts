import type { WFEdge, WFNode } from '../types'
import { makeNodeData } from '../lib/flowCatalog'

type Def = { nodes: WFNode[]; edges: WFEdge[] }
const n = (id: string, kind: string, x: number, y: number, label?: string, params?: Record<string, string>): WFNode => {
  const data = makeNodeData(kind)
  if (label) data.label = label
  if (params) data.params = { ...data.params, ...params }
  const type = kind.startsWith('trigger.') ? 'trigger' : kind.startsWith('cond.') ? 'condition' : 'action'
  return { id, type, position: { x, y }, data }
}
const end = (id: string, x: number, y: number, label = 'End'): WFNode => ({ id, type: 'end', position: { x, y }, data: { kind: 'end', label, params: {} } })
const e = (source: string, target: string, sourceHandle?: 'yes' | 'no'): WFEdge => ({
  id: `${source}-${target}${sourceHandle ? '-' + sourceHandle : ''}`, source, target, sourceHandle: sourceHandle ?? null,
  label: sourceHandle === 'yes' ? 'Yes' : sourceHandle === 'no' ? 'No' : undefined,
})

export const newLeadQualification = (): Def => ({
  nodes: [
    n('t1', 'trigger.new_lead', 300, 0),
    n('a1', 'action.update_customer', 300, 110, 'Create CRM record', { field: 'source', value: 'from lead' }),
    n('a2', 'action.ai_qualify', 300, 220),
    n('c1', 'cond.score', 300, 330, 'Is Qualified?'),
    n('a3', 'action.assign_user', 0, 480, 'Assign Sales Agent'),
    n('a4', 'action.notify_team', 0, 590),
    n('a5', 'action.create_task', 0, 700, 'Create Follow-up'),
    end('z1', 0, 810),
    n('a6', 'action.send_message', 600, 480, 'Send Nurture Message', { text: 'Hi {{customer}}, thanks for your interest. Whenever you are ready, tell us your budget and preferred area and we will shortlist options.' }),
    n('a7', 'action.wait', 600, 590, 'Wait 24 Hours'),
    n('c2', 'cond.lead_status', 600, 700, 'Check Response', { value: 'qualified' }),
    end('z2', 450, 850),
    end('z3', 760, 850),
  ],
  edges: [e('t1', 'a1'), e('a1', 'a2'), e('a2', 'c1'), e('c1', 'a3', 'yes'), e('a3', 'a4'), e('a4', 'a5'), e('a5', 'z1'),
    e('c1', 'a6', 'no'), e('a6', 'a7'), e('a7', 'c2'), e('c2', 'z2', 'yes'), e('c2', 'z3', 'no')],
})

export const viewingFollowUp = (): Def => ({
  nodes: [
    n('t1', 'trigger.status_changed', 200, 0, 'Lead moved to Proposal', { to: 'proposal' }),
    n('a1', 'action.send_message', 200, 110, 'Offer viewing', { text: 'Hi {{customer}}, would you like to schedule a viewing this week? Reply with a day and time that suits you.' }),
    n('a2', 'action.create_task', 200, 220, 'Confirm viewing', { title: 'Confirm viewing with {{customer}}', dueInHours: '24' }),
    n('a3', 'action.wait', 200, 330, 'Wait 48 Hours', { hours: '48' }),
    n('c1', 'cond.lead_status', 200, 440, 'Still in Proposal?', { value: 'proposal' }),
    n('a4', 'action.notify_team', 20, 590, 'Flag no response', { message: 'No response to viewing offer: {{customer}}' }),
    end('z1', 20, 700),
    end('z2', 380, 590),
  ],
  edges: [e('t1', 'a1'), e('a1', 'a2'), e('a2', 'a3'), e('a3', 'c1'), e('c1', 'a4', 'yes'), e('a4', 'z1'), e('c1', 'z2', 'no')],
})

export const inactiveLeadFollowUp = (): Def => ({
  nodes: [
    n('t1', 'trigger.schedule', 200, 0, 'Every day 09:00'),
    n('c1', 'cond.if_else', 200, 110, 'Contacted, no activity?', { field: 'status', op: '=', value: 'contacted' }),
    n('a1', 'action.send_message', 60, 260, 'Check-in message', { text: 'Hi {{customer}}, just checking in. Are you still looking? We have new listings that match your brief.' }),
    n('a2', 'action.add_tag', 60, 370, 'Tag as inactive', { tag: 'inactive' }),
    end('z1', 60, 480),
    end('z2', 380, 260),
  ],
  edges: [e('t1', 'c1'), e('c1', 'a1', 'yes'), e('a1', 'a2'), e('a2', 'z1'), e('c1', 'z2', 'no')],
})

export const appointmentReminder = (): Def => ({
  nodes: [
    n('t1', 'trigger.schedule', 200, 0, 'Every hour', { cron: 'Every hour' }),
    n('c1', 'cond.time', 200, 110, 'Business hours?'),
    n('a1', 'action.send_message', 60, 260, 'Send reminder', { text: 'Hi {{customer}}, a reminder of your viewing appointment tomorrow. Reply to reschedule.' }),
    end('z1', 60, 370),
    end('z2', 380, 260),
  ],
  edges: [e('t1', 'c1'), e('c1', 'a1', 'yes'), e('a1', 'z1'), e('c1', 'z2', 'no')],
})

export const leadAssignment = (): Def => ({
  nodes: [
    n('t1', 'trigger.new_lead', 200, 0),
    n('a1', 'action.assign_user', 200, 110, 'Assign least busy', { strategy: 'Least busy' }),
    n('a2', 'action.notify_team', 200, 220, 'Notify owner', { message: 'New lead assigned: {{customer}}' }),
    end('z1', 200, 330),
  ],
  edges: [e('t1', 'a1'), e('a1', 'a2'), e('a2', 'z1')],
})

export const customerFollowUp = (): Def => ({
  nodes: [
    n('t1', 'trigger.status_changed', 200, 0, 'Deal won', { to: 'won' }),
    n('a1', 'action.send_message', 200, 110, 'Thank you message', { text: 'Thank you {{customer}}! It was a pleasure working with you. Let us know if you need anything else.' }),
    n('a2', 'action.create_task', 200, 220, 'Request review', { title: 'Ask {{customer}} for a review', dueInHours: '72' }),
    end('z1', 200, 330),
  ],
  edges: [e('t1', 'a1'), e('a1', 'a2'), e('a2', 'z1')],
})

export const formToLead = (): Def => ({
  nodes: [
    n('t1', 'trigger.form_submitted', 200, 0),
    n('a1', 'action.create_lead', 200, 110),
    n('a2', 'action.trigger_agent', 200, 220, 'Start qualification', { agent: 'Sales Assistant' }),
    end('z1', 200, 330),
  ],
  edges: [e('t1', 'a1'), e('a1', 'a2'), e('a2', 'z1')],
})

export interface WorkflowTemplate { id: string; name: string; description: string; category: string; build: () => Def }
export const TEMPLATES: WorkflowTemplate[] = [
  { id: 'tpl_qualify', name: 'New Lead Qualification', description: 'Create the CRM record, let VEYA Agent score the lead, then assign or nurture.', category: 'Sales', build: newLeadQualification },
  { id: 'tpl_assign', name: 'Lead Assignment', description: 'Route every new lead to the right sales representative and notify them.', category: 'Sales', build: leadAssignment },
  { id: 'tpl_viewing', name: 'Viewing Follow-up', description: 'Offer a viewing when a lead reaches Proposal and chase if there is no reply.', category: 'Sales', build: viewingFollowUp },
  { id: 'tpl_inactive', name: 'Inactive Lead Follow-up', description: 'Check in with leads that have gone quiet after first contact.', category: 'Retention', build: inactiveLeadFollowUp },
  { id: 'tpl_reminder', name: 'Appointment Reminder', description: 'Send reminders during business hours ahead of appointments.', category: 'Operations', build: appointmentReminder },
  { id: 'tpl_after', name: 'Customer Follow-up', description: 'Thank customers after a deal is won and request a review.', category: 'Retention', build: customerFollowUp },
  { id: 'tpl_form', name: 'Website Form to Lead', description: 'Turn form submissions into leads and start an AI qualification chat.', category: 'Acquisition', build: formToLead },
]
