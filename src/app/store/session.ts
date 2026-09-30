import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ORGS, USERS } from '../data/seed'
import type { Role, Organization, User } from '../types'
import { setActiveOrg } from '../../lib/api'

interface SessionState {
  signedIn: boolean; orgId: string; roleOverride?: Role; theme: 'light' | 'dark'; navCollapsed: boolean
  signIn: () => void; signOut: () => void; switchOrg: (id: string) => void; setRole: (r?: Role) => void
  toggleTheme: () => void; toggleNav: () => void
}

export const useSession = create<SessionState>()(persist((set) => ({
  signedIn: true, orgId: ORGS[0].id, theme: 'light', navCollapsed: false,
  signIn: () => set({ signedIn: true }), signOut: () => set({ signedIn: false }),
  switchOrg: (orgId) => { setActiveOrg(orgId); set({ orgId, roleOverride: undefined }) },
  setRole: (roleOverride) => set({ roleOverride }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
  toggleNav: () => set((s) => ({ navCollapsed: !s.navCollapsed })),
}), { name: 'veya.session', version: 1, partialize: (s) => ({ signedIn: s.signedIn, orgId: s.orgId, theme: s.theme, navCollapsed: s.navCollapsed }) }))

setActiveOrg(useSession.getState().orgId)

export const getOrg = (id: string): Organization => ORGS.find((o) => o.id === id) ?? ORGS[0]
/** The signed-in person is the first member of each workspace (Grace Njeri). */
export const getCurrentUser = (orgId: string): User => USERS.find((u) => u.orgId === orgId) ?? USERS[0]
export const effectiveRole = (orgId: string, override?: Role): Role => override ?? getCurrentUser(orgId).role
