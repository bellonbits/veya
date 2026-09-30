import { BarChart3, BookOpen, Bot, Building2, Columns3, Contact, CreditCard, Inbox, LayoutDashboard, LayoutTemplate, ListChecks, Play, Plug, Radio, Settings, ShieldCheck, Sparkles, Target, TrendingUp, Users, UsersRound, Workflow, Zap, type LucideIcon } from 'lucide-react'
import type { Permission } from '../types'

export interface NavItem { label: string; to: string; icon: LucideIcon; perm?: Permission; end?: boolean }
export interface NavSection { title?: string; items: NavItem[] }

export const NAV: NavSection[] = [
  { items: [{ label: 'Overview', to: '/app/overview', icon: LayoutDashboard }] },
  { title: 'Inbox', items: [{ label: 'Conversations', to: '/app/inbox', icon: Inbox, perm: undefined }] },
  { title: 'CRM', items: [
    { label: 'Leads', to: '/app/crm/leads', icon: Target }, { label: 'Contacts', to: '/app/crm/contacts', icon: Contact },
    { label: 'Companies', to: '/app/crm/companies', icon: Building2 }, { label: 'Pipeline', to: '/app/crm/pipeline', icon: Columns3 }, { label: 'Tasks', to: '/app/crm/tasks', icon: ListChecks },
  ] },
  { title: 'Agent', items: [{ label: 'AI Agents', to: '/app/agent', icon: Bot, end: true }, { label: 'Knowledge', to: '/app/agent/knowledge', icon: BookOpen }] },
  { title: 'Automation', items: [
    { label: 'Flows', to: '/app/flows', icon: Workflow, end: true, perm: 'flows.manage' }, { label: 'Templates', to: '/app/flows/templates', icon: LayoutTemplate, perm: 'flows.manage' }, { label: 'Runs', to: '/app/flows/runs', icon: Play, perm: 'flows.manage' },
  ] },
  { title: 'Analytics', items: [
    { label: 'Overview', to: '/app/analytics', icon: BarChart3, end: true, perm: 'analytics.view' }, { label: 'Sales', to: '/app/analytics/sales', icon: TrendingUp, perm: 'analytics.view' },
    { label: 'Customers', to: '/app/analytics/customers', icon: Users, perm: 'analytics.view' }, { label: 'Automation', to: '/app/analytics/automation', icon: Zap, perm: 'analytics.view' }, { label: 'AI', to: '/app/analytics/ai', icon: Sparkles, perm: 'analytics.view' },
  ] },
  { title: 'Settings', items: [
    { label: 'Organization', to: '/app/settings', icon: Settings, end: true }, { label: 'Team', to: '/app/settings/team', icon: UsersRound }, { label: 'Integrations', to: '/app/settings/integrations', icon: Plug },
    { label: 'Channels', to: '/app/settings/channels', icon: Radio }, { label: 'Billing', to: '/app/settings/billing', icon: CreditCard, perm: 'billing.manage' }, { label: 'Security', to: '/app/settings/security', icon: ShieldCheck },
  ] },
]

export const SETTINGS_NAV: { label: string; to: string; perm?: Permission }[] = [
  { label: 'Organization', to: '/app/settings' }, { label: 'Profile', to: '/app/settings/profile' }, { label: 'Team', to: '/app/settings/team' },
  { label: 'Roles & permissions', to: '/app/settings/roles' }, { label: 'Channels', to: '/app/settings/channels' }, { label: 'Integrations', to: '/app/settings/integrations' },
  { label: 'AI', to: '/app/settings/ai' }, { label: 'Notifications', to: '/app/settings/notifications' }, { label: 'Billing', to: '/app/settings/billing', perm: 'billing.manage' },
  { label: 'Security', to: '/app/settings/security' }, { label: 'Audit logs', to: '/app/settings/audit', perm: 'audit.view' },
]
