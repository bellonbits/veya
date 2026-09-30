import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Plus, Search } from 'lucide-react'
import { useUi, type QuickCreate } from '../../store/ui'
import { useDebounced, useOrg, useHotkey } from '../../hooks'
import { globalSearch, type SearchHit } from '../../services/search'
import { NAV } from '../../layouts/nav'
import { can } from '../../lib/permissions'
import { Kbd } from '../../components/ui/Display'
import { cx } from '../../lib/format'
import { useSession } from '../../store/session'

interface Row { id: string; group: string; label: string; sub?: string; run: () => void; icon?: React.ReactNode }

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen), setOpen = useUi((s) => s.setPalette), setQC = useUi((s) => s.setQuickCreate)
  const { orgId, role } = useOrg(), nav = useNavigate(), toggleTheme = useSession((s) => s.toggleTheme)
  const [q, setQ] = useState(''), [hits, setHits] = useState<SearchHit[]>([]), [i, setI] = useState(0)
  const dq = useDebounced(q, 150)
  const dlg = useRef<HTMLDialogElement>(null)
  useHotkey('mod+k', () => setOpen(!open))
  useHotkey('/', () => setOpen(true))
  useEffect(() => {
    const d = dlg.current
    if (!d) return
    if (open && !d.open) { d.showModal(); setQ(''); setI(0) }
    if (!open && d.open) d.close()
  }, [open])
  useEffect(() => { let live = true; globalSearch(orgId, dq).then((h) => live && setHits(h)); return () => { live = false } }, [dq, orgId])

  const rows = useMemo<Row[]>(() => {
    const go = (to: string) => () => { setOpen(false); nav(to) }
    const create = (k: QuickCreate, label: string): Row => ({ id: `c-${k}`, group: 'Create', label, icon: <Plus className="h-4 w-4" />, run: () => { setOpen(false); setQC(k) } })
    const needle = q.trim().toLowerCase()
    const actions: Row[] = [create('lead', 'New lead'), create('contact', 'New contact'), create('conversation', 'New conversation'), create('workflow', 'New workflow'), create('task', 'New task'),
      { id: 'theme', group: 'Preferences', label: 'Toggle light / dark theme', run: () => { toggleTheme(); setOpen(false) } }]
    const pages: Row[] = (NAV.flatMap((s) => s.items).filter((n) => !n.perm || can(role, n.perm)).map((n) => ({ id: n.to, group: 'Go to', label: n.label, run: go(n.to), icon: <n.icon className="h-4 w-4" /> })) as Row[])
      .concat([['Sales analytics', '/app/analytics/sales'], ['Customer analytics', '/app/analytics/customers'], ['Automation analytics', '/app/analytics/automation'], ['AI analytics', '/app/analytics/ai'], ['Audit log', '/app/settings/audit'], ['Team', '/app/settings/team']].map(([label, to]) => ({ id: to, group: 'Go to', label, run: go(to), icon: undefined })))
    const searchRows: Row[] = hits.map((h) => ({ id: `${h.type}-${h.id}`, group: h.type, label: h.title, sub: h.subtitle, run: go(h.href) }))
    const filt = (r: Row) => !needle || r.label.toLowerCase().includes(needle)
    return needle ? [...searchRows, ...actions.filter(filt), ...pages.filter(filt)] : [...actions.slice(0, 5), ...pages.slice(0, 8)]
  }, [q, hits, role, nav, setOpen, setQC, toggleTheme])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(rows.length - 1, x + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(0, x - 1)) }
    if (e.key === 'Enter') { e.preventDefault(); rows[i]?.run() }
  }
  useEffect(() => { document.getElementById(`cp-${i}`)?.scrollIntoView({ block: 'nearest' }) }, [i])
  let last = ''
  return (
    <dialog ref={dlg} aria-label="Command palette" onClose={() => setOpen(false)} onClick={(e) => { if (e.target === dlg.current) setOpen(false) }}
      className="app mt-[12svh] w-[min(92vw,38rem)] overflow-hidden rounded-2xl border border-edge bg-panel p-0 text-fg shadow-2xl backdrop:bg-black/50" data-theme={useSession.getState().theme}>
      {open && (
        <div onKeyDown={onKey}>
          <div className="flex items-center gap-3 border-b border-edge px-4">
            <Search className="h-4 w-4 text-fg3" aria-hidden />
            <input autoFocus role="combobox" aria-expanded aria-controls="cp-list" aria-activedescendant={`cp-${i}`} aria-label="Search or run a command" value={q} onChange={(e) => { setQ(e.target.value); setI(0) }}
              placeholder="Search customers, leads, conversations, workflows…" className="h-12 flex-1 bg-transparent text-sm text-fg placeholder:text-fg3 focus:outline-none" />
            <Kbd>esc</Kbd>
          </div>
          <div id="cp-list" role="listbox" className="scroll-thin max-h-[52svh] overflow-y-auto p-2">
            {rows.length === 0 && <p className="px-3 py-8 text-center text-sm text-fg3">No results for “{q}”. Try a customer name, lead number or workflow.</p>}
            {rows.map((r, idx) => {
              const head = r.group !== last; last = r.group
              return (
                <div key={r.id}>
                  {head && <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-fg3">{r.group}</p>}
                  <button id={`cp-${idx}`} role="option" aria-selected={idx === i} type="button" onMouseMove={() => setI(idx)} onClick={r.run}
                    className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm', idx === i ? 'bg-accent-soft text-fg' : 'text-fg2')}>
                    <span className="w-4 text-fg3">{r.icon}</span><span className="flex-1 truncate font-medium text-fg">{r.label}</span>{r.sub && <span className="text-xs text-fg3">{r.sub}</span>}{idx === i && <CornerDownLeft className="h-3.5 w-3.5 text-fg3" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </dialog>
  )
}
