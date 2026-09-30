import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from '../../lib/format'
import { Button, IconButton } from './Button'

/** Native <dialog>: focus trap, Esc-to-close and inert background come from the platform. */
function Dialog({ open, onClose, children, className, label }: { open: boolean; onClose: () => void; children: ReactNode; className: string; label: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} aria-label={label} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }}
      className={cx('app fixed m-auto max-h-[92svh] w-full border border-edge bg-panel p-0 text-fg shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-[2px]', className)}
      data-theme={document.querySelector('.app')?.getAttribute('data-theme') ?? 'light'}>
      {open && children}
    </dialog>
  )
}

export function Modal({ open, onClose, title, description, children, footer, wide }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return (
    <Dialog open={open} onClose={onClose} label={title} className={cx('rounded-2xl', wide ? 'max-w-2xl' : 'max-w-md')}>
      <div className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4">
        <div><h2 className="text-base font-semibold">{title}</h2>{description && <p className="mt-0.5 text-sm text-fg2">{description}</p>}</div>
        <IconButton label="Close" size="sm" onClick={onClose}><X className="h-4 w-4" /></IconButton>
      </div>
      <div className="max-h-[65svh] overflow-y-auto px-5 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-edge bg-sunk/50 px-5 py-3">{footer}</div>}
    </Dialog>
  )
}

export function Drawer({ open, onClose, title, children, side = 'right' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; side?: 'right' | 'left' }) {
  return (
    <Dialog open={open} onClose={onClose} label={title} className={cx('h-svh max-h-svh max-w-md sm:max-w-sm', side === 'right' ? 'mr-0 rounded-l-2xl' : 'ml-0 rounded-r-2xl')}>
      <div className="flex h-svh flex-col">
        <div className="flex items-center justify-between border-b border-edge px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <IconButton label="Close" size="sm" onClick={onClose}><X className="h-4 w-4" /></IconButton>
        </div>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </Dialog>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button></>}>
      <p className="text-sm text-fg2">This action is recorded in the audit log.</p>
    </Modal>
  )
}

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const id = useId()
  return (
    <span className="group relative inline-flex" aria-describedby={id}>
      {children}
      <span id={id} role="tooltip" className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-xs font-medium text-canvas opacity-0 shadow transition group-focus-within:opacity-100 group-hover:opacity-100">{text}</span>
    </span>
  )
}

export interface MenuItem { label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean; hint?: string }
export function Dropdown({ trigger, items, align = 'right', label }: { trigger: ReactNode; items: (MenuItem | 'sep')[]; align?: 'left' | 'right'; label: string }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', off)
    list.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
    return () => document.removeEventListener('mousedown', off)
  }, [open])
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); root.current?.querySelector<HTMLButtonElement>('button')?.focus() }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const btns = [...(list.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
      const i = btns.indexOf(document.activeElement as HTMLButtonElement)
      btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length]?.focus()
    }
  }
  return (
    <div ref={root} className="relative inline-block" onKeyDown={onKey}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)} className="rounded-lg">{trigger}</button>
      {open && (
        <div ref={list} role="menu" aria-label={label} className={cx('absolute z-40 mt-1.5 min-w-52 rounded-xl border border-edge bg-panel p-1 shadow-xl', align === 'right' ? 'right-0' : 'left-0')}>
          {items.map((it, i) => it === 'sep' ? <div key={i} role="separator" className="my-1 h-px bg-edge" /> : (
            <button key={it.label} role="menuitem" type="button" disabled={it.disabled} onClick={() => { setOpen(false); it.onSelect() }}
              className={cx('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition hover:bg-sunk focus:bg-sunk focus:outline-none disabled:opacity-40', it.danger ? 'text-bad' : 'text-fg')}>
              {it.icon && <span className="text-fg3">{it.icon}</span>}<span className="flex-1">{it.label}</span>{it.hint && <kbd className="text-[11px] text-fg3">{it.hint}</kbd>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
