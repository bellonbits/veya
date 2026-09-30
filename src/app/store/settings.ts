import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Small per-browser preference store (notification toggles, AI policies, profile edits). Server-side settings arrive with the API. */
interface Prefs { values: Record<string, unknown>; set: (k: string, v: unknown) => void }
export const usePrefs = create<Prefs>()(persist((set) => ({ values: {}, set: (k, v) => set((s) => ({ values: { ...s.values, [k]: v } })) }), { name: 'veya.prefs' }))
export function usePref<T>(key: string, fallback: T): [T, (v: T) => void] {
  const v = usePrefs((s) => s.values[key]) as T | undefined
  const set = usePrefs((s) => s.set)
  return [v ?? fallback, (n: T) => set(key, n)]
}
