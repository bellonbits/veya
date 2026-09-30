import { Link } from 'react-router-dom'
import { Bot, Globe, Mail, MessageCircle, Phone, PhoneCall, Sparkles, StickyNote, Workflow as WorkflowIcon, ArrowRightLeft, ListChecks, Target, MessageSquare } from 'lucide-react'
import type { Activity, ActivityType, Channel } from '../../types'
import { Avatar } from '../ui/Display'
import { Timeline, TimelineItem } from '../ui/Display'
import { ago } from '../../lib/format'
import { USERS } from '../../data/seed'

export const CHANNEL_LABEL: Record<Channel, string> = { whatsapp: 'WhatsApp', website: 'Website', email: 'Email', sms: 'SMS' }
export const ChannelIcon = ({ channel, className = 'h-3.5 w-3.5' }: { channel: Channel; className?: string }) => {
  const I = { whatsapp: MessageCircle, website: Globe, email: Mail, sms: Phone }[channel]
  return <I className={className} aria-hidden />
}
export const ChannelTag = ({ channel }: { channel: Channel }) => <span className="inline-flex items-center gap-1.5 text-xs text-fg2"><ChannelIcon channel={channel} />{CHANNEL_LABEL[channel]}</span>

export function Owner({ id, name }: { id?: string; name?: string }) {
  const u = USERS.find((x) => x.id === id)
  const n = name ?? u?.name
  if (!n) return <span className="text-fg3">Unassigned</span>
  return <span className="inline-flex items-center gap-2"><Avatar name={n} hue={u?.hue} size={22} /><span className="truncate">{n}</span></span>
}

const TYPE_ICON: Record<ActivityType, React.ReactNode> = {
  conversation: <MessageSquare className="h-3.5 w-3.5" />, call: <PhoneCall className="h-3.5 w-3.5" />, email: <Mail className="h-3.5 w-3.5" />, task: <ListChecks className="h-3.5 w-3.5" />,
  note: <StickyNote className="h-3.5 w-3.5" />, workflow: <WorkflowIcon className="h-3.5 w-3.5" />, status: <ArrowRightLeft className="h-3.5 w-3.5" />, lead: <Target className="h-3.5 w-3.5" />,
}
const actorIcon = (a: Activity) => (a.actor.kind === 'ai' ? <Sparkles className="h-3.5 w-3.5 text-accent-ink" /> : a.actor.kind === 'workflow' ? <WorkflowIcon className="h-3.5 w-3.5 text-accent-ink" /> : a.actor.kind === 'system' ? <Bot className="h-3.5 w-3.5" /> : TYPE_ICON[a.type])

export function ActivityBody({ a, links = true }: { a: Activity; links?: boolean }) {
  return (
    <>
      <b className="font-semibold">{a.actor.name}</b>{a.actor.kind === 'ai' && <span className="ml-1 rounded bg-accent-soft px-1 text-[10px] font-bold uppercase text-accent-ink">AI</span>} {a.text}
      {links && (
        <span className="ml-1.5 inline-flex gap-2 text-xs">
          {a.conversationId && <Link className="text-accent-ink hover:underline" to={`/app/inbox/${a.conversationId}`}>Conversation</Link>}
          {a.runId && <Link className="text-accent-ink hover:underline" to={`/app/flows/runs/${a.runId}`}>Run</Link>}
        </span>
      )}
    </>
  )
}
export function ActivityTimeline({ items, limit = 12 }: { items: Activity[]; limit?: number }) {
  const list = items.slice(0, limit)
  return <Timeline>{list.map((a, i) => <TimelineItem key={a.id} icon={actorIcon(a)} time={ago(a.at)} last={i === list.length - 1}><ActivityBody a={a} /></TimelineItem>)}</Timeline>
}
