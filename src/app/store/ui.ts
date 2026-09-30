import { create } from 'zustand'
import type { DateRange } from '../types'
import { makeRange } from '../lib/range'

export type QuickCreate = 'lead' | 'contact' | 'conversation' | 'workflow' | 'task' | null
export interface Toast { id: number; tone: 'success' | 'error' | 'info'; title: string; body?: string; href?: string; action?: string }

interface UiState {
  paletteOpen: boolean; notificationsOpen: boolean; mobileNavOpen: boolean; quickCreate: QuickCreate
  toasts: Toast[]; range: DateRange
  setPalette: (v: boolean) => void; setNotifications: (v: boolean) => void; setMobileNav: (v: boolean) => void
  setQuickCreate: (v: QuickCreate) => void
  toast: (t: Omit<Toast, 'id'>) => void; dismissToast: (id: number) => void
  setRange: (preset: DateRange['preset'], custom?: { from: string; to: string }) => void
}
let n = 0
export const useUi = create<UiState>((set) => ({
  paletteOpen: false, notificationsOpen: false, mobileNavOpen: false, quickCreate: null, toasts: [], range: makeRange('30d'),
  setPalette: (paletteOpen) => set({ paletteOpen }), setNotifications: (notificationsOpen) => set({ notificationsOpen }),
  setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }), setQuickCreate: (quickCreate) => set({ quickCreate }),
  toast: (t) => {
    const id = ++n
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-4) }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), t.tone === 'error' ? 7000 : 4500)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  setRange: (preset, custom) => set({ range: makeRange(preset, custom) }),
}))
