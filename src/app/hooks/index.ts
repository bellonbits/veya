import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDb } from '../store/db'
import { effectiveRole, getCurrentUser, getOrg, useSession } from '../store/session'
import { can } from '../lib/permissions'
import type { Permission } from '../types'

/** Current tenant context: organization, signed-in user and effective role. */
export function useOrg() {
  const orgId = useSession((s) => s.orgId)
  const override = useSession((s) => s.roleOverride)
  return useMemo(() => ({ orgId, org: getOrg(orgId), user: getCurrentUser(orgId), role: effectiveRole(orgId, override) }), [orgId, override])
}
export function usePermission(p: Permission) {
  const { role } = useOrg()
  return can(role, p)
}

interface ServiceState<T> { data?: T; error?: Error; loading: boolean }
const seen = new Set<string>()

/**
 * Data-layer hook. Calls an async service (mock today, REST tomorrow), shows `loading` only on the first
 * fetch for a key, and silently refreshes whenever platform records change (`rev`) so every screen stays in sync.
 */
export function useService<T>(key: string, fn: () => Promise<T>, deps: unknown[] = []) {
  const rev = useDb((s) => s.rev)
  const orgId = useSession((s) => s.orgId)
  const [state, setState] = useState<ServiceState<T>>({ loading: true })
  const fnRef = useRef(fn)
  fnRef.current = fn
  const [tick, setTick] = useState(0)
  const full = `${orgId}:${key}`
  useEffect(() => {
    let live = true
    const first = !seen.has(full)
    ;(async () => {
      if (first) await new Promise((r) => setTimeout(r, 220))
      try {
        const data = await fnRef.current()
        seen.add(full)
        if (live) setState({ data, loading: false })
      } catch (e) {
        if (live) setState({ error: e as Error, loading: false })
      }
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full, rev, tick, ...deps])
  const refetch = useCallback(() => { setState((s) => ({ ...s, error: undefined, loading: !s.data })); setTick((t) => t + 1) }, [])
  return { ...state, refetch }
}

export function useDebounced<T>(value: T, ms = 200) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}

export function useHotkey(combo: string, handler: (e: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable
      const parts = combo.toLowerCase().split('+')
      const key = parts.at(-1)!
      const wantMod = parts.includes('mod')
      if (wantMod ? !(e.metaKey || e.ctrlKey) : (e.metaKey || e.ctrlKey || e.altKey)) return
      if (!wantMod && typing) return
      if (e.key.toLowerCase() !== key) return
      e.preventDefault()
      ref.current(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [combo, enabled])
}

export function useMedia(query: string) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setM(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return m
}

/** Warn before leaving the tab with unsaved edits. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])
}

import { useSearchParams } from 'react-router-dom'
/** URL-synced list state (filters, sort, page) so views are shareable and metric drill-downs can deep-link. */
export function useQs() {
  const [sp, setSp] = useSearchParams()
  const get = (k: string, d = '') => sp.get(k) ?? d
  const set = (patch: Record<string, string | undefined>) => {
    const n = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)))
    if (!('page' in patch)) n.delete('page')
    setSp(n, { replace: true })
  }
  return { get, set, sp }
}
