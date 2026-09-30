import { useEffect, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import { cx } from '../../lib/format'

/** Click-to-edit text. Enter/blur saves, Esc cancels. Read-only when `disabled`. */
export function InlineEdit({ value, onSave, label, placeholder = 'Add…', disabled, type = 'text', className }: { value: string; onSave: (v: string) => void; label: string; placeholder?: string; disabled?: boolean; type?: string; className?: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) ref.current?.select() }, [editing])
  const commit = () => { setEditing(false); if (draft.trim() !== value) onSave(draft.trim()) }
  if (editing) {
    return <input ref={ref} type={type} aria-label={label} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
      className={cx('h-7 w-full rounded-md border border-accent bg-panel px-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/25', className)} />
  }
  return (
    <button type="button" disabled={disabled} onClick={() => setEditing(true)} aria-label={`Edit ${label}`}
      className={cx('group -mx-1.5 flex min-h-7 w-full items-center justify-between gap-2 rounded-md px-1.5 text-left text-sm', disabled ? 'cursor-default' : 'hover:bg-sunk', className)}>
      <span className={cx('min-w-0 break-words', value ? 'text-fg' : 'text-fg3')}>{value || placeholder}</span>
      {!disabled && <Pencil className="h-3 w-3 shrink-0 text-fg3 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />}
    </button>
  )
}
