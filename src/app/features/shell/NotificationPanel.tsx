import { useNavigate } from 'react-router-dom'
import { AlertTriangle, AtSign, Bell, CalendarClock, MessageCircle, ShieldAlert, Target, UserCheck } from 'lucide-react'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { useOrg } from '../../hooks'
import { Drawer } from '../../components/ui/Overlay'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/States'
import { ago, cx } from '../../lib/format'
import type { NotificationType } from '../../types'

const ICON: Record<NotificationType, React.ReactNode> = {
  lead: <Target className="h-4 w-4" />, assigned: <UserCheck className="h-4 w-4" />, workflow_failed: <AlertTriangle className="h-4 w-4 text-bad" />, reply: <MessageCircle className="h-4 w-4" />,
  task_due: <CalendarClock className="h-4 w-4" />, escalation: <ShieldAlert className="h-4 w-4 text-warn" />, mention: <AtSign className="h-4 w-4" />, system: <Bell className="h-4 w-4" />,
}
export const useUnread = () => { const { orgId } = useOrg(); return useDb((s) => s.notifications.filter((n) => n.orgId === orgId && !n.read).length) }

export function NotificationPanel() {
  const open = useUi((s) => s.notificationsOpen), setOpen = useUi((s) => s.setNotifications)
  const { orgId } = useOrg(), nav = useNavigate()
  const all = useDb((s) => s.notifications), read = useDb((s) => s.markNotificationRead), readAll = useDb((s) => s.markAllNotificationsRead)
  const items = all.filter((n) => n.orgId === orgId).sort((a, b) => b.at - a.at)
  return (
    <Drawer open={open} onClose={() => setOpen(false)} title="Notifications">
      <div className="flex items-center justify-between border-b border-edge px-4 py-2"><span className="text-xs text-fg3">{items.filter((n) => !n.read).length} unread</span><Button size="sm" variant="ghost" onClick={() => readAll(orgId)}>Mark all as read</Button></div>
      {items.length === 0 ? <EmptyState compact title="You're all caught up" body="New leads, replies, escalations and failures will show up here." /> : (
        <ul>{items.map((n) => (
          <li key={n.id} className="border-b border-edge/70">
            <button type="button" onClick={() => { read(n.id); setOpen(false); nav(n.href) }} className={cx('flex w-full gap-3 px-4 py-3 text-left transition hover:bg-sunk', !n.read && 'bg-accent-soft/50')}>
              <span className="mt-0.5 text-fg2">{ICON[n.type]}</span>
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-semibold text-fg">{n.title}{!n.read && <><span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden /><span className="sr-only">unread</span></>}</span>
                <span className="mt-0.5 block text-sm text-fg2">{n.body}</span><span className="mt-1 block text-xs text-fg3">{ago(n.at)}</span></span>
            </button>
          </li>))}
        </ul>)}
    </Drawer>
  )
}
