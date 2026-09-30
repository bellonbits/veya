// Every tenant-owned entity carries `orgId`. The backend (FastAPI) enforces isolation; the client never trusts it.

export type Role = 'owner' | 'admin' | 'manager' | 'agent' | 'viewer'
export type Permission =
  | 'inbox.reply' | 'crm.write' | 'crm.delete' | 'agent.manage' | 'flows.manage'
  | 'analytics.view' | 'team.manage' | 'billing.manage' | 'security.manage' | 'audit.view' | 'integrations.manage'

export interface Organization { id: string; name: string; slug: string; industry: string; plan: 'Starter' | 'Growth' | 'Scale'; region: string }
export interface User { id: string; orgId: string; name: string; email: string; role: Role; title: string; hue: number }

export type Channel = 'whatsapp' | 'website' | 'email' | 'sms'
export type LeadStatus = 'new' | 'qualified' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type LeadSource = 'WhatsApp' | 'Website' | 'Referral' | 'Facebook Ads' | 'Walk-in' | 'Email'

export interface Company { id: string; orgId: string; name: string; industry: string; website: string; location: string }
export interface Customer {
  id: string; orgId: string; name: string; phone: string; email: string; location: string
  tags: string[]; companyId?: string; ownerId?: string; status: 'new' | 'active' | 'inactive'
  createdAt: number; lastInteractionAt: number; custom: Record<string, string>
}
export interface Lead {
  id: string; orgId: string; number: number; customerId: string; companyId?: string; title: string
  source: LeadSource; ownerId?: string; status: LeadStatus; value: number; score: number
  createdAt: number; qualifiedAt?: number; closedAt?: number; lastActivityAt: number
  nextAction: string; qualification: Record<string, string>; createdBy: 'ai' | 'human' | 'workflow'
  /** Furthest funnel stage reached (index into FUNNEL_ORDER); lost leads keep it. */
  reached: number
}
export interface Conversation {
  id: string; orgId: string; customerId: string; channel: Channel; status: 'open' | 'snoozed' | 'closed'
  handledBy: 'ai' | 'human'; agentId?: string; assigneeId?: string; leadId?: string
  unread: number; tags: string[]; createdAt: number; lastMessageAt: number; escalated: boolean
  firstResponseSec?: number
}
export interface Message {
  id: string; orgId: string; conversationId: string; author: 'customer' | 'ai' | 'human'
  userId?: string; text: string; at: number; attachments?: string[]; note?: boolean
}
export interface Task {
  id: string; orgId: string; title: string; assigneeId?: string; dueAt: number
  priority: 'low' | 'medium' | 'high'; status: 'open' | 'done'; leadId?: string; customerId?: string
  completedAt?: number
}

export type ActivityType = 'conversation' | 'call' | 'email' | 'task' | 'note' | 'workflow' | 'status' | 'lead'
export interface Actor { kind: 'user' | 'ai' | 'workflow' | 'system'; id?: string; name: string }
export interface Activity {
  id: string; orgId: string; at: number; type: ActivityType; actor: Actor; text: string
  leadId?: string; customerId?: string; conversationId?: string; workflowId?: string; runId?: string
}
export interface AuditEntry {
  id: string; orgId: string; at: number; actor: Actor; action: string
  entityType: 'lead' | 'conversation' | 'customer' | 'workflow' | 'task' | 'agent' | 'user' | 'settings'
  entityId: string; entityLabel: string; previous?: string; next?: string
}

export type EventName =
  | 'lead.created' | 'lead.qualified' | 'lead.status_changed' | 'lead.won' | 'lead.lost'
  | 'conversation.created' | 'conversation.message_received' | 'conversation.message_sent' | 'conversation.escalated' | 'conversation.closed'
  | 'workflow.started' | 'workflow.completed' | 'workflow.failed'
  | 'agent.message_generated' | 'agent.escalated'
  | 'task.created' | 'task.completed' | 'customer.created'
export interface PlatformEvent {
  id: string; orgId: string; at: number; name: EventName; entityId?: string
  meta?: { source?: string; value?: number; ownerId?: string; responseSec?: number; handledBy?: 'ai' | 'human'; workflowId?: string; durationMs?: number; reason?: string; channel?: Channel }
}

export interface Agent {
  id: string; orgId: string; name: string; description: string; status: 'active' | 'paused' | 'draft'
  channels: Channel[]; tone: 'friendly' | 'professional' | 'concise'; language: string; responseStyle: string
  identity: string; behaviors: { id: string; when: string; then: string }[]
  qualification: { field: string; enabled: boolean; required: boolean }[]
  escalation: { triggers: string[]; teamId: string; notifyChannel: 'whatsapp' | 'email' | 'inbox'; confidenceThreshold: number }
  workflowIds: string[]; updatedAt: number
}
export interface KnowledgeItem {
  id: string; orgId: string; agentId?: string; title: string; type: 'document' | 'url' | 'faq' | 'text' | 'product' | 'service'
  status: 'processing' | 'ready' | 'failed'; updatedAt: number; sizeLabel: string; error?: string
}

export type NodeKind = string
export interface WFNodeData extends Record<string, unknown> { kind: NodeKind; label: string; params: Record<string, string> }
export interface WFNode { id: string; type: 'trigger' | 'condition' | 'action' | 'end'; position: { x: number; y: number }; data: WFNodeData }
export interface WFEdge { id: string; source: string; target: string; sourceHandle?: string | null; label?: string }
export interface Workflow {
  id: string; orgId: string; name: string; description: string; status: 'active' | 'paused' | 'draft'
  nodes: WFNode[]; edges: WFEdge[]; updatedAt: number
}
export interface RunStep {
  nodeId: string; label: string; kind: NodeKind; status: 'completed' | 'failed' | 'waiting' | 'skipped'
  startedAt: number; durationMs: number; input?: unknown; output?: unknown; error?: string
}
export interface WorkflowRun {
  id: string; orgId: string; workflowId: string; startedAt: number; completedAt?: number
  status: 'running' | 'completed' | 'failed' | 'waiting'; steps: RunStep[]
  leadId?: string; customerId?: string; conversationId?: string; triggeredBy: string
}

export type NotificationType = 'lead' | 'assigned' | 'workflow_failed' | 'reply' | 'task_due' | 'escalation' | 'mention' | 'system'
export interface Notification {
  id: string; orgId: string; at: number; type: NotificationType; title: string; body: string; read: boolean; href: string
}

/* ---- API contract helpers ---- */
export interface Page<T> { items: T[]; total: number; page: number; pageSize: number }
export interface ListQuery { q?: string; page?: number; pageSize?: number; sort?: string; order?: 'asc' | 'desc'; [k: string]: string | number | undefined }
export interface DateRange { from: number; to: number; label: string; preset: 'today' | '7d' | '30d' | '90d' | 'custom' }

export const FUNNEL_ORDER: LeadStatus[] = ['new', 'qualified', 'contacted', 'proposal', 'negotiation', 'won']
export const STATUS_ORDER: LeadStatus[] = ['new', 'qualified', 'contacted', 'proposal', 'negotiation', 'won', 'lost']
