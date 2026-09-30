import { Link, useSearchParams } from 'react-router-dom'
import { Search, Sparkles, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebounced, useOrg, useService } from '../../hooks'
import { listConversations } from '../../services/inbox'
import { Avatar, Badge } from '../../components/ui/Display'
import { Select, Input } from '../../components/ui/Form'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { ChannelIcon } from '../../components/domain/Common'
import { ago, cx } from '../../lib/format'
import { useUi } from '../../store/ui'
import { Button } from '../../components/ui/Button'

const FILTERS = [['all', 'All open'], ['unread', 'Unread'], ['assigned', 'Assigned'], ['unassigned', 'Unassigned'], ['ai', 'AI handled'], ['human', 'Human handled'], ['closed', 'Closed']] as const

export function ConversationList({ activeId }: { activeId?: string }) {
  const { orgId } = useOrg()
  const [sp, setSp] = useSearchParams()
  const filter = sp.get('filter') ?? 'all', channel = sp.get('channel') ?? ''
  const [q, setQ] = useState(sp.get('q') ?? '')
  const dq = useDebounced(q, 200)
  useEffect(() => { const n = new URLSearchParams(sp); dq ? n.set('q', dq) : n.delete('q'); if (n.toString() !== sp.toString()) setSp(n, { replace: true }) }, [dq]) // eslint-disable-line react-hooks/exhaustive-deps
  const { data, error, refetch } = useService('conversations', () => listConversations(orgId, { filter, channel: channel || undefined, q: dq }), [filter, channel, dq])
  const setQC = useUi((s) => s.setQuickCreate)
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); v && v !== 'all' ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }) }
  const keep = sp.toString() ? `?${sp.toString()}` : ''
  return (
    <div className="flex h-full min-h-0 flex-col bg-panel">
      <div className="space-y-2 border-b border-edge p-3">
        <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-fg3" aria-hidden />
          <Input aria-label="Search conversations" placeholder="Search conversations" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" /></div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Select aria-label="Filter conversations" value={filter} onChange={(e) => set('filter', e.target.value)}>
            {FILTERS.map(([id, l]) => <option key={id} value={id}>{l}{data ? ` (${data.counts[id]})` : ''}</option>)}
          </Select>
          <Select aria-label="Channel" value={channel} onChange={(e) => set('channel', e.target.value)} className="w-28"><option value="">All channels</option><option value="whatsapp">WhatsApp</option><option value="website">Website</option><option value="email">Email</option></Select>
        </div>
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {error ? <ErrorState error={error} onRetry={refetch} /> : !data ? <div className="p-3"><LoadingState rows={6} label="Loading conversations" /></div> : data.items.length === 0 ? (
          <EmptyState compact title={q || filter !== 'all' ? 'No matching conversations' : 'No conversations yet'} body={q || filter !== 'all' ? 'Try a different search or filter.' : 'Conversations from your connected channels will appear here.'}
            action={!q && filter === 'all' ? <Button onClick={() => setQC('conversation')}>New conversation</Button> : undefined} />
        ) : (
          <ul aria-label="Conversations">
            {data.items.map((c) => (
              <li key={c.id}>
                <Link to={`/app/inbox/${c.id}${keep}`} aria-current={c.id === activeId ? 'true' : undefined}
                  className={cx('block border-b border-edge/70 px-3 py-3 transition hover:bg-sunk/70', c.id === activeId && 'bg-accent-soft/60')}>
                  <div className="flex gap-3">
                    <Avatar name={c.customerName} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2"><span className={cx('truncate text-sm text-fg', c.unread ? 'font-bold' : 'font-semibold')}>{c.customerName}</span><span className="shrink-0 text-xs text-fg3">{ago(c.lastMessageAt)}</span></div>
                      <p className={cx('mt-0.5 line-clamp-1 text-[13px]', c.unread ? 'text-fg' : 'text-fg2')}>{c.lastAuthor !== 'customer' && <span className="text-fg3">{c.lastAuthor === 'ai' ? 'AI: ' : 'You: '}</span>}{c.lastMessage}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-fg3">
                        <ChannelIcon channel={c.channel} />
                        {c.handledBy === 'ai' ? <span className="inline-flex items-center gap-1 text-accent-ink"><Sparkles className="h-3 w-3" aria-hidden />AI</span> : <span className="inline-flex items-center gap-1"><User className="h-3 w-3" aria-hidden />{c.assigneeName?.split(' ')[0] ?? 'Unassigned'}</span>}
                        {c.escalated && <Badge tone="warn">Escalated</Badge>}{c.status !== 'open' && <Badge>{c.status}</Badge>}
                        {c.unread > 0 && <span className="num ml-auto rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white"><span className="sr-only">{c.unread} unread messages</span><span aria-hidden>{c.unread}</span></span>}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
