import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bot, ChevronDown, Clock, PanelRight, Paperclip, Send, Sparkles, Target, X } from 'lucide-react'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { useOrg, usePermission } from '../../hooks'
import type { ConversationDetail } from '../../services/inbox'
import { Avatar, Badge, StatusBadge } from '../../components/ui/Display'
import { Button, IconButton } from '../../components/ui/Button'
import { Dropdown } from '../../components/ui/Overlay'
import { ChannelTag } from '../../components/domain/Common'
import { MessageBubble } from '../../components/domain/MessageBubble'
import { USERS } from '../../data/seed'
import { TEMPLATES, draftReply, extractLeadInfo, summarize, translateSw } from './assist'
import { ConfirmDialog } from '../../components/ui/Overlay'

export function Thread({ d, onOpenContext }: { d: ConversationDetail; onOpenContext: () => void }) {
  const { conversation: cv, customer, lead, messages } = d
  const { user } = useOrg(), nav = useNavigate(), toast = useUi((s) => s.toast)
  const db = useDb.getState(), canReply = usePermission('inbox.reply'), canWrite = usePermission('crm.write')
  const workflows = useDb((s) => s.workflows).filter((w) => w.orgId === cv.orgId && w.status === 'active')
  const [text, setText] = useState(''), [files, setFiles] = useState<string[]>([]), [note, setNote] = useState<{ title: string; body: string; apply?: () => void } | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const scroller = useRef<HTMLDivElement>(null), fileRef = useRef<HTMLInputElement>(null)
  const team = USERS.filter((u) => u.orgId === cv.orgId && u.role !== 'viewer')
  const agentName = d.agentName ?? 'VEYA Agent'

  useEffect(() => { const el = scroller.current; if (el) el.scrollTop = el.scrollHeight }, [messages.length, cv.id])
  useEffect(() => { if (cv.unread) db.markRead(cv.id) }, [cv.id, cv.unread, db])
  useEffect(() => { setText(''); setFiles([]); setNote(null) }, [cv.id])

  const send = () => {
    if (!text.trim() && !files.length) return
    const m = db.sendMessage(cv.id, { text: text.trim() || '(attachment)', author: 'human', userId: user.id })
    if (files.length) useDb.setState((s) => ({ messages: s.messages.map((x) => (x.id === m.id ? { ...x, attachments: files } : x)) }))
    setText(''); setFiles([])
  }
  const assist = (kind: 'draft' | 'summary' | 'translate' | 'extract') => {
    if (kind === 'draft') setText(draftReply(messages, customer.name, user.name.split(' ')[0]))
    if (kind === 'summary') setNote({ title: 'Conversation summary', body: summarize(messages, lead) })
    if (kind === 'translate') { const t = translateSw(text); t ? setText(t) : toast({ tone: 'info', title: 'Nothing to translate', body: 'Type a reply first. The demo translator covers common greetings and phrases only.' }) }
    if (kind === 'extract') {
      const info = extractLeadInfo(messages)
      const body = Object.entries(info).map(([k, v]) => `${k}: ${v}`).join('\n') || 'No qualification details found in the customer messages yet.'
      setNote({ title: 'Extracted lead information', body, apply: lead && Object.keys(info).length ? () => { db.updateLead(lead.id, { qualification: { ...lead.qualification, ...info } }); toast({ tone: 'success', title: 'Lead qualification updated', href: `/app/crm/leads/${lead.id}`, action: 'View lead' }); setNote(null) } : undefined })
    }
  }
  const aiHandling = cv.handledBy === 'ai' && cv.status === 'open'

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-edge bg-panel px-3 py-2.5 sm:px-4">
        <Link to="/app/inbox" aria-label="Back to conversations" className="rounded-lg p-1.5 text-fg2 hover:bg-sunk lg:hidden"><ArrowLeft className="h-5 w-5" /></Link>
        <Avatar name={customer.name} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><Link to={`/app/crm/contacts/${customer.id}`} className="truncate text-sm font-semibold text-fg hover:text-accent-ink">{customer.name}</Link><StatusBadge status={cv.status} />{cv.escalated && <Badge tone="warn">Escalated</Badge>}</div>
          <p className="flex flex-wrap items-center gap-x-3 text-xs text-fg3"><ChannelTag channel={cv.channel} /><span>{cv.handledBy === 'ai' ? `Handled by ${agentName}` : `Assigned to ${d.assignee?.name ?? 'nobody yet'}`}</span></p>
        </div>
        <div className="flex items-center gap-1.5">
          {lead ? <Button size="sm" icon={<Target className="h-3.5 w-3.5" />} onClick={() => nav(`/app/crm/leads/${lead.id}`)}>Lead #{lead.number}</Button>
            : <Button size="sm" variant="accent" disabled={!canWrite} icon={<Target className="h-3.5 w-3.5" />} onClick={() => { const l = db.createLeadFromConversation(cv.id); if (l) { toast({ tone: 'success', title: `Lead #${l.number} created`, body: 'Opened in CRM', href: `/app/crm/leads/${l.id}` }); nav(`/app/crm/leads/${l.id}`) } }}>Create lead</Button>}
          <Dropdown label="Assign conversation" trigger={<span className="inline-flex h-8 items-center gap-1 rounded-lg border border-edge2 bg-panel px-2.5 text-[13px] font-semibold text-fg hover:bg-sunk">Assign<ChevronDown className="h-3.5 w-3.5" /></span>}
            items={[...team.map((u) => ({ label: u.name, hint: u.id === cv.assigneeId ? '✓' : '', onSelect: () => { db.assignConversation(cv.id, u.id); toast({ tone: 'success', title: `Assigned to ${u.name}` }) } })), 'sep' as const, { label: 'Unassign', onSelect: () => db.assignConversation(cv.id, undefined) }]} />
          <Dropdown label="More actions" trigger={<span className="inline-flex h-8 items-center gap-1 rounded-lg border border-edge2 bg-panel px-2.5 text-[13px] font-semibold text-fg hover:bg-sunk">Actions<ChevronDown className="h-3.5 w-3.5" /></span>}
            items={[
              { label: cv.tags.includes('vip') ? 'Remove tag: vip' : 'Tag as vip', onSelect: () => db.tagConversation(cv.id, 'vip', !cv.tags.includes('vip')) },
              { label: 'Tag as follow-up', onSelect: () => db.tagConversation(cv.id, 'follow-up') },
              { label: 'Create task', onSelect: () => { const t = db.createTask({ title: `Follow up with ${customer.name.split(' ')[0]}`, dueAt: Date.now() + 86_400_000, leadId: lead?.id, customerId: customer.id }); toast({ tone: 'success', title: 'Task created', body: t.title, href: '/app/crm/tasks', action: 'View tasks' }) } },
              { label: 'Escalate to human', disabled: cv.escalated, onSelect: () => { db.escalateConversation(cv.id, 'Escalated from Inbox'); toast({ tone: 'info', title: 'Conversation escalated' }) } },
              'sep', ...(workflows.length ? workflows.map((w) => ({ label: `Run: ${w.name}`, onSelect: () => { const r = db.triggerWorkflow(w.id, { leadId: lead?.id, customerId: customer.id, conversationId: cv.id }); if (r) toast({ tone: r.status === 'failed' ? 'error' : 'success', title: `${w.name} ${r.status}`, href: `/app/flows/runs/${r.id}`, action: 'View run' }) } })) : [{ label: 'No active workflows', disabled: true, onSelect: () => {} }]),
              'sep', { label: 'Snooze', icon: <Clock className="h-4 w-4" />, disabled: cv.status === 'snoozed', onSelect: () => { db.setConversationStatus(cv.id, 'snoozed'); toast({ tone: 'info', title: 'Snoozed until the customer replies' }) } },
              cv.status === 'closed' ? { label: 'Reopen', onSelect: () => db.setConversationStatus(cv.id, 'open') } : { label: 'Close conversation', danger: true, onSelect: () => setConfirmClose(true) },
            ]} />
          <IconButton label="Customer details" size="sm" className="xl:hidden" onClick={onOpenContext}><PanelRight className="h-4 w-4" /></IconButton>
        </div>
      </header>

      {aiHandling && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent/20 bg-accent-soft px-4 py-2 text-[13px] text-fg">
          <span className="inline-flex items-center gap-2"><Bot className="h-4 w-4 text-accent-ink" aria-hidden /><b>{agentName}</b> is handling this conversation.</span>
          <Button size="sm" disabled={!canReply} onClick={() => { db.assignConversation(cv.id, user.id); toast({ tone: 'success', title: 'You took over this conversation' }) }}>Take over</Button>
        </div>
      )}

      <div ref={scroller} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        <ol role="log" aria-live="polite" aria-label={`Conversation with ${customer.name}`} className="mx-auto flex max-w-3xl flex-col gap-3.5">
          {messages.map((m) => <MessageBubble key={m.id} m={m} customerName={customer.name} agentName={agentName} />)}
        </ol>
      </div>

      {note && (
        <div className="mx-3 mb-2 rounded-xl border border-accent/25 bg-accent-soft p-3 text-sm sm:mx-5">
          <div className="flex items-center justify-between"><p className="flex items-center gap-1.5 font-semibold text-fg"><Sparkles className="h-3.5 w-3.5 text-accent-ink" aria-hidden />{note.title}</p><button type="button" aria-label="Dismiss" onClick={() => setNote(null)}><X className="h-4 w-4 text-fg3" /></button></div>
          <p className="mt-1 whitespace-pre-line text-fg2">{note.body}</p>
          {note.apply && <Button size="sm" variant="accent" className="mt-2" onClick={note.apply}>Save to lead</Button>}
        </div>
      )}

      <form className="border-t border-edge bg-panel p-3 sm:px-5" onSubmit={(e) => { e.preventDefault(); send() }}>
        {!canReply ? <p className="py-2 text-center text-sm text-fg3">Your role can read this conversation but not reply.</p> : (<>
          {files.length > 0 && <ul className="mb-2 flex flex-wrap gap-1.5">{files.map((f) => <li key={f}><Badge className="gap-1.5"><Paperclip className="h-3 w-3" />{f}<button type="button" aria-label={`Remove ${f}`} onClick={() => setFiles(files.filter((x) => x !== f))}><X className="h-3 w-3" /></button></Badge></li>)}</ul>}
          <label htmlFor="composer" className="sr-only">Message to {customer.name}</label>
          <textarea id="composer" value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={`Reply to ${customer.name.split(' ')[0]}…  (Enter to send, Shift+Enter for a new line)`}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            className="w-full resize-none rounded-xl border border-edge2 bg-canvas px-3 py-2.5 text-sm text-fg placeholder:text-fg3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25" />
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => { setFiles([...files, ...[...(e.target.files ?? [])].map((f) => f.name)]); e.target.value = '' }} />
              <IconButton label="Attach file" size="sm" onClick={() => fileRef.current?.click()}><Paperclip className="h-4 w-4" /></IconButton>
              <Dropdown label="Templates" align="left" trigger={<span className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] font-semibold text-fg2 hover:bg-sunk">Templates<ChevronDown className="h-3 w-3" /></span>} items={TEMPLATES.map((t) => ({ label: t.label, onSelect: () => setText(t.text) }))} />
              <Dropdown label="AI assist" align="left" trigger={<span className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold text-accent-ink hover:bg-accent-soft"><Sparkles className="h-3.5 w-3.5" />AI assist</span>}
                items={[{ label: 'Draft reply', onSelect: () => assist('draft') }, { label: 'Summarize conversation', onSelect: () => assist('summary') }, { label: 'Translate to Swahili', onSelect: () => assist('translate') }, { label: 'Extract lead information', onSelect: () => assist('extract') }]} />
            </div>
            <Button type="submit" variant="accent" size="sm" disabled={!text.trim() && !files.length} icon={<Send className="h-3.5 w-3.5" />}>Send</Button>
          </div>
        </>)}
      </form>
      <ConfirmDialog open={confirmClose} onClose={() => setConfirmClose(false)} danger title="Close this conversation?" description={`${customer.name} can reopen it by replying.`} confirmLabel="Close conversation" onConfirm={() => { db.setConversationStatus(cv.id, 'closed'); toast({ tone: 'success', title: 'Conversation closed' }) }} />
    </div>
  )
}
