import { ApiError } from '../../lib/api'
import type { ListQuery, Page } from '../types'
import { USERS } from '../data/seed'

/** Every service takes `orgId` first — the client-side twin of the X-Org-Id header the API will require. */
export const notFound = (what: string) => new ApiError(404, `${what} not found`)

export function paginate<T>(items: T[], q: ListQuery, defaultSize = 25): Page<T> {
  const pageSize = Math.min(100, Number(q.pageSize) || defaultSize)
  const page = Math.max(1, Number(q.page) || 1)
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize }
}

export function sortBy<T>(items: T[], q: ListQuery, fallback: keyof T & string, get?: Record<string, (x: T) => string | number>) {
  const key = (q.sort as string) || fallback
  const dir = q.order === 'asc' ? 1 : -1
  const val = (x: T) => (get?.[key] ? get[key](x) : (x as Record<string, unknown>)[key]) as string | number | undefined
  return [...items].sort((a, b) => {
    const av = val(a) ?? '', bv = val(b) ?? ''
    return (typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))) * dir
  })
}
export const matches = (q: string | undefined, ...fields: (string | undefined)[]) => {
  if (!q) return true
  const n = q.trim().toLowerCase()
  return fields.some((f) => f?.toLowerCase().includes(n))
}
export const orgUsers = (orgId: string) => USERS.filter((u) => u.orgId === orgId)
export const userById = (id?: string) => USERS.find((u) => u.id === id)
