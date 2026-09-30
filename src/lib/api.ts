// REST-first client for the future FastAPI backend. No secrets live in the browser:
// auth is an httpOnly cookie (or short-lived JWT) issued by the API; CSRF token is echoed in a header.
const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

let orgId: string | null = null
export const setActiveOrg = (id: string | null) => { orgId = id }

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const csrf = document.cookie.match(/(?:^|; )csrf=([^;]+)/)?.[1]
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(orgId ? { 'X-Org-Id': orgId } : {}),
      ...(csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {}),
      ...init.headers,
    },
  })
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.status === 204 ? (undefined as T) : res.json()
}
