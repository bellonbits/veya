import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useMedia, useOrg, useService } from '../../hooks'
import { getConversation, listConversations } from '../../services/inbox'
import { ConversationList } from './ConversationList'
import { Thread } from './Thread'
import { CustomerPanel } from './CustomerPanel'
import { Drawer } from '../../components/ui/Overlay'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { cx } from '../../lib/format'

export default function InboxPage() {
  const { conversationId: id } = useParams()
  const { orgId } = useOrg(), nav = useNavigate()
  const isLg = useMedia('(min-width: 1024px)')
  const [ctx, setCtx] = useState(false)
  const detail = useService(`conv-${id}`, () => (id ? getConversation(orgId, id) : Promise.reject(new Error('none'))), [id])
  const first = useService('conv-first', async () => (await listConversations(orgId, { filter: 'all' })).items[0]?.id, [])
  useEffect(() => { if (isLg && !id && first.data) nav(`/app/inbox/${first.data}`, { replace: true }) }, [isLg, id, first.data, nav])
  return (
    <div className="grid h-full min-h-0 grid-cols-1 grid-rows-1 bg-canvas lg:grid-cols-[minmax(280px,340px)_1fr] xl:grid-cols-[minmax(280px,340px)_1fr_minmax(290px,340px)]">
      <title>Inbox · VEYA</title>
      <section aria-label="Conversation list" className={cx('min-h-0 border-r border-edge', id ? 'hidden lg:block' : 'block', 'h-[calc(100svh-3.5rem-3.75rem)] md:h-full')}><ConversationList activeId={id} /></section>
      <section aria-label="Conversation" className={cx('min-h-0', !id && 'hidden lg:block', 'h-[calc(100svh-3.5rem-3.75rem)] md:h-full')}>
        {!id ? <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="Select a conversation" body="Choose a conversation to see the thread and the customer's CRM record side by side." />
          : detail.error ? <ErrorState error={detail.error} onRetry={detail.refetch} back={{ to: '/app/inbox', label: 'Back to inbox' }} />
          : !detail.data ? <div className="p-6"><LoadingState rows={6} label="Loading conversation" /></div>
          : <Thread d={detail.data} onOpenContext={() => setCtx(true)} />}
      </section>
      <aside aria-label="Customer context" className="scroll-thin hidden min-h-0 overflow-y-auto border-l border-edge bg-panel xl:block">{detail.data && <CustomerPanel d={detail.data} />}</aside>
      <Drawer open={ctx && !!detail.data} onClose={() => setCtx(false)} title="Customer & CRM">{detail.data && <CustomerPanel d={detail.data} />}</Drawer>
    </div>
  )
}
