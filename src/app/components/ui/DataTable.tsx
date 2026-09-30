import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { cx } from '../../lib/format'
import { Button } from './Button'
import { Skeleton } from './Display'

export interface Column<T> {
  id: string; header: string; cell: (row: T) => ReactNode; sortKey?: string; className?: string
  /** Hide this column in the small-screen card layout. */
  hideOnCard?: boolean; align?: 'right'
}
interface Props<T> {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; rowHref?: (r: T) => string; loading?: boolean; empty?: ReactNode
  sort?: string; order?: 'asc' | 'desc'; onSort?: (key: string) => void
  page?: number; pageSize?: number; total?: number; onPage?: (p: number) => void; caption: string
}

export function DataTable<T>({ columns, rows, rowKey, rowHref, loading, empty, sort, order, onSort, page = 1, pageSize = 25, total = rows.length, onPage, caption }: Props<T>) {
  const nav = useNavigate()
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (loading) return <div role="status" className="space-y-2 p-4"><span className="sr-only">Loading {caption}…</span>{Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
  if (!rows.length) return <>{empty}</>
  const go = (r: T) => rowHref && nav(rowHref(r))
  const [first, ...rest] = columns
  return (
    <div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-edge text-left">
              {columns.map((c) => {
                const active = sort === c.sortKey
                return (
                  <th key={c.id} scope="col" aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : undefined} className={cx('whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-fg3', c.align === 'right' && 'text-right')}>
                    {c.sortKey && onSort
                      ? <button type="button" onClick={() => onSort(c.sortKey!)} className="inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-fg">{c.header}{active && (order === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</button>
                      : c.header}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} onClick={() => go(r)} className={cx('border-b border-edge/70 last:border-0', rowHref && 'cursor-pointer transition hover:bg-sunk/70')}>
                {columns.map((c, i) => (
                  <td key={c.id} className={cx('px-4 py-3 align-middle text-fg', c.align === 'right' && 'text-right', c.className)}>
                    {i === 0 && rowHref ? <span className="contents" onClick={(e) => e.stopPropagation()}><a href={rowHref(r)} onClick={(e) => { e.preventDefault(); go(r) }} className="block rounded focus-visible:outline-2">{c.cell(r)}</a></span> : c.cell(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul aria-label={caption} className="divide-y divide-edge md:hidden">
        {rows.map((r) => (
          <li key={rowKey(r)}>
            <div onClick={() => go(r)} className={cx('space-y-2 px-4 py-3.5', rowHref && 'cursor-pointer active:bg-sunk')}>
              <div className="font-medium text-fg">{first.cell(r)}</div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                {rest.filter((c) => !c.hideOnCard).map((c) => <div key={c.id} className="min-w-0"><dt className="text-[11px] uppercase tracking-wide text-fg3">{c.header}</dt><dd className="truncate text-fg">{c.cell(r)}</dd></div>)}
              </dl>
            </div>
          </li>
        ))}
      </ul>
      {onPage && total > pageSize && (
        <nav aria-label="Pagination" className="flex items-center justify-between border-t border-edge px-4 py-3 text-sm text-fg2">
          <p className="num">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</p>
          <div className="flex items-center gap-1.5">
            <Button size="sm" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={<ChevronLeft className="h-4 w-4" />} />
            <span className="num px-2">{page} / {pages}</span>
            <Button size="sm" aria-label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)} icon={<ChevronRight className="h-4 w-4" />} />
          </div>
        </nav>
      )}
    </div>
  )
}
