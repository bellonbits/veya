import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, Lock, RefreshCw } from 'lucide-react'
import { Button, LinkButton } from './Button'
import { Skeleton } from './Display'
import { ApiError } from '../../../lib/api'

export function EmptyState({ icon, title, body, action, compact }: { icon?: ReactNode; title: string; body: string; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'px-4 py-8' : 'px-6 py-16'}`}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sunk text-fg3">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-fg2">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
export function LoadingState({ rows = 5, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3 p-1">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
    </div>
  )
}
export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return <div role="status" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><span className="sr-only">Loading…</span>{Array.from({ length: count }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
}
export function ErrorState({ error, onRetry, back }: { error?: Error; onRetry?: () => void; back?: { to: string; label: string } }) {
  const notFound = error instanceof ApiError && error.status === 404
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-bad-soft text-bad"><AlertTriangle className="h-5 w-5" /></div>
      <h3 className="text-sm font-semibold text-fg">{notFound ? error.message : 'Something went wrong'}</h3>
      <p className="mt-1 max-w-sm text-sm text-fg2">{notFound ? 'It may have been deleted, or it belongs to another organization.' : (error?.message ?? 'We could not load this. Check your connection and try again.')}</p>
      <div className="mt-4 flex gap-2">
        {!notFound && onRetry && <Button icon={<RefreshCw className="h-4 w-4" />} onClick={onRetry}>Try again</Button>}
        {back && <LinkButton to={back.to}>{back.label}</LinkButton>}
      </div>
    </div>
  )
}
export function NoPermission({ what }: { what: string }) {
  return <EmptyState icon={<Lock className="h-5 w-5" />} title="You don't have access to this" body={`${what} is limited to roles with the right permission. Ask an Owner or Admin to change your role.`} action={<LinkButton to="/app/overview">Back to overview</LinkButton>} />
}
export function PartialNotice({ children }: { children: ReactNode }) {
  return <div role="status" className="mb-4 flex items-start gap-2.5 rounded-lg border border-warn/30 bg-warn-soft px-3.5 py-2.5 text-sm text-warn"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><p>{children}</p></div>
}
