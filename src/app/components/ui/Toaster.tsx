import { Link } from 'react-router-dom'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useUi } from '../../store/ui'

export function Toaster() {
  const toasts = useUi((s) => s.toasts), dismiss = useUi((s) => s.dismissToast)
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6">
      {toasts.map((t) => {
        const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? XCircle : Info
        return (
          <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-edge bg-panel p-3.5 shadow-xl">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${t.tone === 'success' ? 'text-ok' : t.tone === 'error' ? 'text-bad' : 'text-accent-ink'}`} aria-hidden />
            <div className="min-w-0 flex-1 text-sm"><p className="font-semibold text-fg">{t.title}</p>{t.body && <p className="mt-0.5 text-fg2">{t.body}</p>}
              {t.href && <Link to={t.href} onClick={() => dismiss(t.id)} className="mt-1 inline-block font-semibold text-accent-ink hover:underline">{t.action ?? 'Open'}</Link>}</div>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-fg3 hover:text-fg"><X className="h-4 w-4" /></button>
          </div>
        )
      })}
    </div>
  )
}
