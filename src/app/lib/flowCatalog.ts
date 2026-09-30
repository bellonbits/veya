import type { WFNodeData } from '../types'

export interface ParamDef { key: string; label: string; placeholder?: string; options?: string[] }
export interface NodeDef {
  kind: string; type: 'trigger' | 'condition' | 'action'; group: string; label: string; icon: string
  description: string; params: ParamDef[]; defaults?: Record<string, string>
}

const trig = (kind: string, label: string, icon: string, description: string, params: ParamDef[] = [], defaults?: Record<string, string>): NodeDef =>
  ({ kind, type: 'trigger', group: 'Triggers', label, icon, description, params, defaults })
const cond = (kind: string, label: string, icon: string, description: string, params: ParamDef[], defaults?: Record<string, string>): NodeDef =>
  ({ kind, type: 'condition', group: 'Conditions', label, icon, description, params, defaults })
const act = (kind: string, label: string, icon: string, description: string, params: ParamDef[] = [], defaults?: Record<string, string>): NodeDef =>
  ({ kind, type: 'action', group: 'Actions', label, icon, description, params, defaults })

const statuses = ['new', 'qualified', 'contacted', 'proposal', 'negotiation', 'won', 'lost']

export const NODE_CATALOG: NodeDef[] = [
  trig('trigger.new_lead', 'New Lead', 'UserPlus', 'Runs when a lead is created from any source.'),
  trig('trigger.new_conversation', 'New Conversation', 'MessageSquarePlus', 'Runs when a customer starts a conversation.'),
  trig('trigger.new_customer', 'New Customer', 'User', 'Runs when a new customer record is created.'),
  trig('trigger.form_submitted', 'Form Submitted', 'FileText', 'Runs when a website form is submitted.', [{ key: 'form', label: 'Form', placeholder: 'Contact form' }]),
  trig('trigger.tag_added', 'Tag Added', 'Tag', 'Runs when a tag is added to a customer.', [{ key: 'tag', label: 'Tag', placeholder: 'vip' }]),
  trig('trigger.status_changed', 'Status Changed', 'ArrowRightLeft', 'Runs when a lead moves to a status.', [{ key: 'to', label: 'Moved to', options: statuses }], { to: 'proposal' }),
  trig('trigger.schedule', 'Schedule', 'CalendarClock', 'Runs on a recurring schedule.', [{ key: 'cron', label: 'Schedule', options: ['Every day 09:00', 'Every Monday 08:00', 'Every hour'] }], { cron: 'Every day 09:00' }),
  trig('trigger.webhook', 'Webhook', 'Webhook', 'Runs when an external system calls a VEYA webhook URL.'),

  cond('cond.if_else', 'If / Else', 'GitBranch', 'Branch on any value.', [{ key: 'field', label: 'Field', options: ['score', 'status', 'source', 'value', 'budget'] }, { key: 'op', label: 'Operator', options: ['>=', '=', 'contains'] }, { key: 'value', label: 'Value', placeholder: '60' }], { field: 'score', op: '>=', value: '60' }),
  cond('cond.customer_field', 'Customer field', 'UserCog', 'Branch on a customer field.', [{ key: 'field', label: 'Field', options: ['location', 'tags', 'status'] }, { key: 'op', label: 'Operator', options: ['=', 'contains'] }, { key: 'value', label: 'Value' }], { field: 'location', op: 'contains', value: 'Nairobi' }),
  cond('cond.lead_status', 'Lead status', 'Flag', 'Branch on the lead status.', [{ key: 'value', label: 'Status is', options: statuses }], { value: 'qualified' }),
  cond('cond.message_contains', 'Message contains', 'MessageSquareText', 'Branch on the last customer message.', [{ key: 'value', label: 'Contains', placeholder: 'viewing' }], { value: 'viewing' }),
  cond('cond.score', 'Score', 'Gauge', 'Branch on lead score.', [{ key: 'value', label: 'Score at least', placeholder: '60' }], { value: '60' }),
  cond('cond.time', 'Time condition', 'Clock', 'Branch on business hours.', [{ key: 'value', label: 'Currently', options: ['within business hours', 'outside business hours'] }], { value: 'within business hours' }),

  act('action.create_lead', 'Create Lead', 'Target', 'Create a lead from the current customer.'),
  act('action.update_lead', 'Update Lead', 'PencilLine', 'Change lead status.', [{ key: 'status', label: 'Set status', options: statuses }], { status: 'contacted' }),
  act('action.ai_qualify', 'AI Qualification', 'Sparkles', 'VEYA Agent scores the lead from conversation and qualification fields.'),
  act('action.create_task', 'Create Task', 'ListTodo', 'Create a follow-up task.', [{ key: 'title', label: 'Task title', placeholder: 'Follow up with {{customer}}' }, { key: 'dueInHours', label: 'Due in (hours)', placeholder: '24' }], { title: 'Follow up with {{customer}}', dueInHours: '24' }),
  act('action.assign_user', 'Assign User', 'UserCheck', 'Assign the lead to a sales representative.', [{ key: 'strategy', label: 'Assign to', options: ['Round robin', 'Least busy', 'Specific user'] }], { strategy: 'Round robin' }),
  act('action.send_message', 'Send Message', 'Send', 'Send a message in the conversation.', [{ key: 'text', label: 'Message', placeholder: 'Hi {{customer}}, …' }], { text: 'Hi {{customer}}, thanks for reaching out. We will be in touch shortly.' }),
  act('action.send_email', 'Send Email', 'Mail', 'Send an email to the customer.', [{ key: 'subject', label: 'Subject' }]),
  act('action.add_tag', 'Add Tag', 'Tag', 'Add a tag to the customer.', [{ key: 'tag', label: 'Tag', placeholder: 'hot-lead' }], { tag: 'hot-lead' }),
  act('action.update_customer', 'Update Customer', 'UserPen', 'Update a customer field.', [{ key: 'field', label: 'Field' }, { key: 'value', label: 'Value' }]),
  act('action.trigger_agent', 'Trigger Agent', 'Bot', 'Hand the conversation to a VEYA Agent.', [{ key: 'agent', label: 'Agent', placeholder: 'Nairobi Prime Assistant' }]),
  act('action.wait', 'Wait', 'Hourglass', 'Pause the workflow.', [{ key: 'hours', label: 'Wait (hours)', placeholder: '24' }], { hours: '24' }),
  act('action.webhook', 'Webhook', 'Webhook', 'Call an external URL.', [{ key: 'url', label: 'URL', placeholder: 'https://…' }]),
  act('action.notify_team', 'Notify Team', 'BellRing', 'Notify the team inside VEYA.', [{ key: 'message', label: 'Message', placeholder: 'New qualified lead: {{customer}}' }], { message: 'New qualified lead: {{customer}}' }),
]

export const nodeDef = (kind: string) => NODE_CATALOG.find((n) => n.kind === kind)
export const makeNodeData = (kind: string): WFNodeData => {
  const d = nodeDef(kind)!
  return { kind, label: d.label, params: { ...(d.defaults ?? {}) } }
}
