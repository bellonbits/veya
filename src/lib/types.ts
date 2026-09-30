// Every tenant-owned record carries orgId. The backend enforces isolation; the client never trusts it.
export type Role = 'owner' | 'admin' | 'agent' | 'viewer'
export interface Organization { id: string; name: string; slug: string }
export interface User { id: string; orgId: string; name: string; email: string; role: Role }
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost'
export interface Lead { id: string; orgId: string; name: string; source: string; status: LeadStatus; nextAction: string }
export interface Conversation { id: string; orgId: string; customer: string; channel: string; preview: string; at: string; handledBy: 'agent' | 'human' }
