import type { Permission, Role } from '../types'

const all: Permission[] = ['inbox.reply', 'crm.write', 'crm.delete', 'agent.manage', 'flows.manage', 'analytics.view', 'team.manage', 'billing.manage', 'security.manage', 'audit.view', 'integrations.manage']
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: all,
  admin: all.filter((p) => p !== 'billing.manage'),
  manager: ['inbox.reply', 'crm.write', 'crm.delete', 'agent.manage', 'flows.manage', 'analytics.view', 'audit.view'],
  agent: ['inbox.reply', 'crm.write'],
  viewer: ['analytics.view'],
}
export const ROLE_LABEL: Record<Role, string> = { owner: 'Owner', admin: 'Admin', manager: 'Manager', agent: 'Agent', viewer: 'Viewer' }
export const ROLE_BLURB: Record<Role, string> = {
  owner: 'Full access including billing and security.', admin: 'Manage workspace, team and automation. No billing.',
  manager: 'Manage sales, agents and flows. View analytics and audit log.', agent: 'Reply in Inbox and work leads and tasks.', viewer: 'Read-only access to analytics.',
}
export const can = (role: Role, p: Permission) => ROLE_PERMISSIONS[role].includes(p)
