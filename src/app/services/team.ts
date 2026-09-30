import { USERS } from '../data/seed'
import { useDb } from '../store/db'
import type { Role, User } from '../types'

/* PATCH /api/v1/users/{id}, POST /api/v1/users/invite — mock persistence mutates the in-memory directory. */
export function setUserRole(orgId: string, userId: string, role: Role) {
  const u = USERS.find((x) => x.id === userId && x.orgId === orgId); if (!u || u.role === role) return
  const prev = u.role
  u.role = role
  const db = useDb.getState()
  db.log({ orgId, actor: { kind: 'system', name: 'Settings' }, type: 'note', text: `changed ${u.name}'s role` }, { action: 'user.role_changed', entityType: 'user', entityId: u.id, entityLabel: u.name, previous: prev, next: role })
}
export function inviteUser(orgId: string, name: string, email: string, role: Role): User {
  const u: User = { id: `${orgId}_u${USERS.filter((x) => x.orgId === orgId).length + 1}`, orgId, name, email, role, title: 'Invited', hue: (USERS.length * 67 + 250) % 360 }
  USERS.push(u)
  useDb.getState().log({ orgId, actor: { kind: 'system', name: 'Settings' }, type: 'note', text: `invited ${name}` }, { action: 'user.invited', entityType: 'user', entityId: u.id, entityLabel: name, next: role })
  return u
}
