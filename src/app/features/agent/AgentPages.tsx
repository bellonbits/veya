import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bot, Plus, RotateCcw, Send, Sparkles, Trash2 } from 'lucide-react'
import { Page } from '../../layouts/Page'
import { useOrg, usePermission, useService, useUnsavedWarning } from '../../hooks'
import { getAgent, listAgents, listWorkflows, type AgentRow } from '../../services/flows'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { USERS } from '../../data/seed'
import { Avatar, Badge, Card, MetricCard, PageHeader, SectionHeader, StatusBadge } from '../../components/ui/Display'
import { Button, LinkButton } from '../../components/ui/Button'
import { Field, Input, Select, Switch, Textarea } from '../../components/ui/Form'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { ChannelIcon, CHANNEL_LABEL } from '../../components/domain/Common'
import { KnowledgeList } from './KnowledgeList'
import { runTurn, type TurnResult } from './testEngine'
import { ago, cx, pct } from '../../lib/format'
import type { Agent, Channel } from '../../types'

export function AgentList() {
  const { orgId } = useOrg(), nav = useNavigate(), canManage = usePermission('agent.manage'), toast = useUi((s) => s.toast)
  const { data, error, refetch } = useService('agents', () => listAgents(orgId))
  const create = () => { const a = useDb.getState().createAgent({ name: 'New agent', description: 'Describe what this agent does.' }); toast({ tone: 'success', title: 'Draft agent created' }); nav(`/app/agent/${a.id}`) }
  const cols: Column<AgentRow>[] = [
    { id: 'name', header: 'Agent', cell: (a) => <span className="flex items-center gap-2.5"><Avatar name={a.name} ai size={30} /><span className="min-w-0"><span className="block truncate font-semibold">{a.name}</span><span className="block truncate text-xs text-fg3">{a.description}</span></span></span> },
    { id: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
    { id: 'channels', header: 'Channels', cell: (a) => <span className="flex flex-wrap gap-2">{a.channels.map((c) => <span key={c} className="inline-flex items-center gap-1 text-xs text-fg2"><ChannelIcon channel={c} />{CHANNEL_LABEL[c]}</span>)}</span> },
    { id: 'convs', header: 'Conversations', align: 'right', cell: (a) => <span className="num">{a.conversations.toLocaleString('en-KE')}</span> },
    { id: 'res', header: 'Resolution rate', align: 'right', cell: (a) => <span className="num font-semibold">{a.resolutionRate === null ? '—' : pct(a.resolutionRate, 0)}</span> },
    { id: 'esc', header: 'Escalations', align: 'right', cell: (a) => <span className="num">{a.escalations}</span> },
    { id: 'last', header: 'Last activity', cell: (a) => <span className="text-fg2">{a.lastActivity ? ago(a.lastActivity) : 'Never'}</span> },
  ]
  return (
    <Page wide>
      <title>AI Agents · VEYA</title>
      <PageHeader title="VEYA Agent" sub="Intelligent customer communication and lead qualification" actions={<><LinkButton to="/app/agent/knowledge">Knowledge</LinkButton><Button variant="accent" icon={<Plus className="h-4 w-4" />} disabled={!canManage} onClick={create}>New agent</Button></>} />
      <Card pad={false}>{error ? <ErrorState error={error} onRetry={refetch} /> : (
        <DataTable caption="AI agents" columns={cols} rows={data ?? []} rowKey={(a) => a.id} rowHref={(a) => `/app/agent/${a.id}`} loading={!data}
          empty={<EmptyState icon={<Bot className="h-5 w-5" />} title="Create your first agent" body="Agents answer customers, qualify leads and hand over to your team when needed." action={<Button variant="accent" onClick={create}>New agent</Button>} />} />)}</Card>
    </Page>
  )
}

interface Ctx { draft: Agent; set: (p: Partial<Agent>) => void; readOnly: boolean; row: AgentRow }
const AgentCtx = createContext<Ctx>(null as never)
const useAgent = () => useContext(AgentCtx)

export function AgentLayout() {
  const { id = '' } = useParams(), { orgId } = useOrg(), toast = useUi((s) => s.toast)
  const canManage = usePermission('agent.manage')
  const { data: row, error, refetch } = useService(`agent-${id}`, () => getAgent(orgId, id), [id])
  const [draft, setDraft] = useState<Agent | null>(null), [dirty, setDirty] = useState(false)
  useEffect(() => { if (row && (!draft || draft.id !== row.id)) { setDraft(row); setDirty(false) } }, [row]) // eslint-disable-line react-hooks/exhaustive-deps
  useUnsavedWarning(dirty)
  const back = <Link to="/app/agent" onClick={(e) => { if (dirty && !window.confirm('Discard unsaved changes?')) e.preventDefault() }} className="mb-3 inline-flex items-center gap-1.5 text-sm text-fg2 hover:text-fg"><ArrowLeft className="h-4 w-4" />Agents</Link>
  if (error) return <Page><ErrorState error={error} onRetry={refetch} back={{ to: '/app/agent', label: 'Back to agents' }} /></Page>
  if (!row || !draft) return <Page><LoadingState rows={6} label="Loading agent" /></Page>
  const tab = ({ isActive }: { isActive: boolean }) => cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition', isActive ? 'border-accent text-fg' : 'border-transparent text-fg3 hover:text-fg')
  const save = () => {
    const patch: Partial<Agent> = { name: draft.name, description: draft.description, status: draft.status, channels: draft.channels, tone: draft.tone, language: draft.language, responseStyle: draft.responseStyle, identity: draft.identity, behaviors: draft.behaviors, qualification: draft.qualification, escalation: draft.escalation, workflowIds: draft.workflowIds }
    useDb.getState().updateAgent(draft.id, patch); setDirty(false); toast({ tone: 'success', title: 'Agent saved' })
  }
  return (
    <Page>
      <title>{`${draft.name} · VEYA Agent`}</title>
      <PageHeader back={back} title={<span className="flex flex-wrap items-center gap-3"><Avatar name={draft.name} ai size={40} />{draft.name}<StatusBadge status={draft.status} /></span>} sub={draft.description}
        actions={<>{dirty && <span role="status" className="text-sm font-medium text-warn">Unsaved changes</span>}<Button disabled={!dirty} onClick={() => { setDraft(row); setDirty(false) }} icon={<RotateCcw className="h-4 w-4" />}>Discard</Button><Button variant="accent" disabled={!dirty || !canManage} onClick={save}>Save changes</Button></>}
        tabs={<nav aria-label="Agent sections" className="scroll-thin -mx-1 flex overflow-x-auto border-b border-edge px-1">
          <NavLink end to={`/app/agent/${id}`} className={tab}>General</NavLink><NavLink to={`/app/agent/${id}/behavior`} className={tab}>Behavior</NavLink><NavLink to={`/app/agent/${id}/knowledge`} className={tab}>Knowledge</NavLink>
          <NavLink to={`/app/agent/${id}/test`} className={tab}>Test</NavLink><NavLink to={`/app/agent/${id}/analytics`} className={tab}>Analytics</NavLink></nav>} />
      <AgentCtx.Provider value={{ draft, set: (p) => { setDraft({ ...draft, ...p }); setDirty(true) }, readOnly: !canManage, row }}><Outlet /></AgentCtx.Provider>
    </Page>
  )
}

export function AgentGeneral() {
  const { draft, set, readOnly } = useAgent()
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><SectionHeader title="General" />
        <fieldset disabled={readOnly} className="space-y-4">
          <Field label="Agent name">{(id) => <Input id={id} value={draft.name} onChange={(e) => set({ name: e.target.value })} />}</Field>
          <Field label="Description">{(id) => <Textarea id={id} value={draft.description} onChange={(e) => set({ description: e.target.value })} />}</Field>
          <Field label="Status" hint="Only Active agents answer customers.">{(id) => <Select id={id} value={draft.status} onChange={(e) => set({ status: e.target.value as Agent['status'] })}><option value="active">Active</option><option value="paused">Paused</option><option value="draft">Draft</option></Select>}</Field>
          <div><p className="mb-1.5 text-[13px] font-semibold text-fg">Channels</p><div className="flex flex-wrap gap-2">{(['whatsapp', 'website', 'email', 'sms'] as Channel[]).map((c) => { const on = draft.channels.includes(c); return <button key={c} type="button" aria-pressed={on} onClick={() => set({ channels: on ? draft.channels.filter((x) => x !== c) : [...draft.channels, c] })} className={cx('inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium', on ? 'border-accent bg-accent-soft text-accent-ink' : 'border-edge2 text-fg2 hover:bg-sunk')}><ChannelIcon channel={c} />{CHANNEL_LABEL[c]}</button> })}</div></div>
        </fieldset>
      </Card>
      <Card><SectionHeader title="Personality" />
        <fieldset disabled={readOnly} className="space-y-4">
          <Field label="Tone">{(id) => <Select id={id} value={draft.tone} onChange={(e) => set({ tone: e.target.value as Agent['tone'] })}><option value="friendly">Friendly</option><option value="professional">Professional</option><option value="concise">Concise</option></Select>}</Field>
          <Field label="Language">{(id) => <Select id={id} value={draft.language} onChange={(e) => set({ language: e.target.value })}>{['English', 'Swahili', 'English + Swahili'].map((l) => <option key={l}>{l}</option>)}</Select>}</Field>
          <Field label="Response style">{(id) => <Input id={id} value={draft.responseStyle} onChange={(e) => set({ responseStyle: e.target.value })} />}</Field>
          <Field label="Business identity" hint="How the agent introduces your business.">{(id) => <Textarea id={id} rows={4} value={draft.identity} onChange={(e) => set({ identity: e.target.value })} />}</Field>
        </fieldset>
      </Card>
    </div>
  )
}

export function AgentBehavior() {
  const { draft, set, readOnly } = useAgent(), { orgId } = useOrg()
  const wfs = useService('agent-wfs', () => listWorkflows(orgId))
  const team = USERS.filter((u) => u.orgId === orgId && u.role !== 'viewer')
  const [trigger, setTrigger] = useState('')
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2"><SectionHeader title="Behavior" sub="What the agent should do, in your words" action={<Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} disabled={readOnly} onClick={() => set({ behaviors: [...draft.behaviors, { id: `b${Date.now()}`, when: '', then: '' }] })}>Add rule</Button>} />
        {draft.behaviors.length === 0 ? <p className="text-sm text-fg3">No rules yet. Add one, e.g. “When a customer asks about pricing, provide information from the knowledge base.”</p> : (
          <ul className="space-y-3">{draft.behaviors.map((b, i) => (
            <li key={b.id} className="grid gap-2 rounded-lg border border-edge p-3 sm:grid-cols-[1fr_1fr_auto]">
              <Field label="When">{(id) => <Input id={id} disabled={readOnly} value={b.when} placeholder="A customer asks about pricing" onChange={(e) => set({ behaviors: draft.behaviors.map((x, j) => (j === i ? { ...x, when: e.target.value } : x)) })} />}</Field>
              <Field label="Then">{(id) => <Input id={id} disabled={readOnly} value={b.then} placeholder="Answer from the knowledge base" onChange={(e) => set({ behaviors: draft.behaviors.map((x, j) => (j === i ? { ...x, then: e.target.value } : x)) })} />}</Field>
              <button type="button" aria-label="Remove rule" disabled={readOnly} onClick={() => set({ behaviors: draft.behaviors.filter((_, j) => j !== i) })} className="self-end rounded-lg p-2 text-fg3 hover:bg-sunk hover:text-bad"><Trash2 className="h-4 w-4" /></button>
            </li>))}</ul>)}
      </Card>
      <Card><SectionHeader title="Lead qualification" sub="Fields the agent collects before creating a lead" />
        <table className="w-full text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wide text-fg3"><th className="pb-2 font-semibold">Field</th><th className="pb-2 text-center font-semibold">Collect</th><th className="pb-2 text-center font-semibold">Required</th></tr></thead>
          <tbody>{draft.qualification.map((q, i) => (
            <tr key={q.field} className="border-t border-edge"><th scope="row" className="py-2 text-left font-medium text-fg">{q.field}</th>
              <td className="py-2 text-center"><span className="inline-flex"><Switch label={`Collect ${q.field}`} disabled={readOnly} checked={q.enabled} onChange={(v) => set({ qualification: draft.qualification.map((x, j) => (j === i ? { ...x, enabled: v, required: v && x.required } : x)) })} /></span></td>
              <td className="py-2 text-center"><span className="inline-flex"><Switch label={`${q.field} required`} disabled={readOnly || !q.enabled} checked={q.required} onChange={(v) => set({ qualification: draft.qualification.map((x, j) => (j === i ? { ...x, required: v } : x)) })} /></span></td></tr>))}</tbody></table>
      </Card>
      <div className="space-y-4">
        <Card><SectionHeader title="Escalation" />
          <fieldset disabled={readOnly} className="space-y-4">
            <div><p className="mb-1.5 text-[13px] font-semibold text-fg">Escalate when</p>
              <ul className="space-y-1.5">{draft.escalation.triggers.map((t) => <li key={t} className="flex items-center justify-between rounded-lg bg-sunk px-3 py-1.5 text-sm text-fg">{t}<button type="button" aria-label={`Remove trigger ${t}`} onClick={() => set({ escalation: { ...draft.escalation, triggers: draft.escalation.triggers.filter((x) => x !== t) } })} className="text-fg3 hover:text-bad"><Trash2 className="h-3.5 w-3.5" /></button></li>)}</ul>
              <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (trigger.trim()) { set({ escalation: { ...draft.escalation, triggers: [...draft.escalation.triggers, trigger.trim()] } }); setTrigger('') } }}><Input aria-label="New escalation trigger" placeholder="Add a trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)} /><Button type="submit">Add</Button></form></div>
            <Field label={`Confidence threshold: ${draft.escalation.confidenceThreshold}%`} hint="Below this match strength the agent hands over instead of guessing.">{(id) => <input id={id} type="range" min={30} max={95} value={draft.escalation.confidenceThreshold} onChange={(e) => set({ escalation: { ...draft.escalation, confidenceThreshold: Number(e.target.value) } })} className="w-full accent-[var(--c-accent)]" />}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Assigned team member">{(id) => <Select id={id} value={draft.escalation.teamId} onChange={(e) => set({ escalation: { ...draft.escalation, teamId: e.target.value } })}>{team.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>}</Field>
              <Field label="Notify via">{(id) => <Select id={id} value={draft.escalation.notifyChannel} onChange={(e) => set({ escalation: { ...draft.escalation, notifyChannel: e.target.value as Agent['escalation']['notifyChannel'] } })}><option value="inbox">VEYA Inbox</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option></Select>}</Field>
            </div>
          </fieldset></Card>
        <Card><SectionHeader title="Workflows" sub="Flows the agent can trigger (VEYA Flow)" />
          {!wfs.data ? <LoadingState rows={2} /> : wfs.data.length === 0 ? <p className="text-sm text-fg3">No workflows yet. <Link className="text-accent-ink hover:underline" to="/app/flows">Create one</Link>.</p> : <ul className="space-y-2">{wfs.data.map((w) => (
            <li key={w.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0"><Link to={`/app/flows/${w.id}`} className="font-medium text-fg hover:text-accent-ink">{w.name}</Link> <StatusBadge status={w.status} /></span><Switch label={`Allow agent to trigger ${w.name}`} disabled={readOnly} checked={draft.workflowIds.includes(w.id)} onChange={(v) => set({ workflowIds: v ? [...draft.workflowIds, w.id] : draft.workflowIds.filter((x) => x !== w.id) })} /></li>))}</ul>}</Card>
      </div>
    </div>
  )
}

export function AgentKnowledge() { const { draft } = useAgent(); return <KnowledgeList agentId={draft.id} /> }
export function KnowledgePage() { return <Page><title>Knowledge · VEYA Agent</title><PageHeader title="Knowledge base" sub="Everything your agents can search" /><KnowledgeList /></Page> }

interface Turn { from: 'you' | 'agent'; text: string; result?: TurnResult }
export function AgentTest() {
  const { draft } = useAgent(), { orgId } = useOrg()
  const allKn = useDb((s) => s.knowledge)
  const kn = allKn.filter((k) => k.orgId === orgId)
  const [turns, setTurns] = useState<Turn[]>([]), [text, setText] = useState('')
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => { const el = box.current; if (el) el.scrollTop = el.scrollHeight }, [turns.length])
  const send = (t: string) => {
    if (!t.trim()) return
    const history = turns.filter((x) => x.from === 'you').map((x) => x.text)
    const result = runTurn(draft, kn, history, t)
    setTurns((p) => [...p, { from: 'you', text: t }, { from: 'agent', text: result.reply, result }]); setText('')
  }
  const last = [...turns].reverse().find((t) => t.result)?.result
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <Card pad={false} className="flex h-[32rem] flex-col">
        <div className="flex items-center justify-between border-b border-edge px-4 py-2.5"><p className="flex items-center gap-2 text-sm font-semibold text-fg"><Sparkles className="h-4 w-4 text-accent-ink" aria-hidden />Test sandbox</p><Button size="sm" variant="ghost" onClick={() => setTurns([])}>Reset</Button></div>
        <div ref={box} role="log" aria-live="polite" className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4">
          {turns.length === 0 && <div className="flex h-full flex-col items-center justify-center text-center"><p className="text-sm text-fg2">Chat as a customer to rehearse this agent. Nothing here creates real records.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">{["Hi, I'm looking for a 2 bedroom apartment in Kilimani", 'How much is rent in Westlands?', 'I want to speak to a person'].map((s) => <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-edge2 px-3 py-1.5 text-xs font-medium text-fg2 hover:bg-sunk">{s}</button>)}</div></div>}
          {turns.map((t, i) => <div key={i} className={cx('flex', t.from === 'you' ? 'justify-end' : 'justify-start')}><p className={cx('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm', t.from === 'you' ? 'bg-fg text-canvas' : 'border border-accent/25 bg-accent-soft text-fg')}><span className="sr-only">{t.from === 'you' ? 'You: ' : 'Agent: '}</span>{t.text}</p></div>)}
        </div>
        <form className="flex gap-2 border-t border-edge p-3" onSubmit={(e) => { e.preventDefault(); send(text) }}><Input aria-label="Message as a customer" placeholder="Type as a customer…" value={text} onChange={(e) => setText(e.target.value)} /><Button type="submit" variant="accent" icon={<Send className="h-4 w-4" />} disabled={!text.trim()}>Send</Button></form>
      </Card>
      <Card><SectionHeader title="What the agent did" sub="Transparent reasoning from your configuration" />
        {!last ? <p className="text-sm text-fg3">Send a message to see the detected intent, matched knowledge, collected fields and next action.</p> : (
          <dl className="space-y-3 text-sm">
            <div><dt className="text-xs text-fg3">Intent</dt><dd className="font-medium text-fg">{last.intent}</dd></div>
            <div><dt className="text-xs text-fg3">Knowledge match</dt><dd className="font-medium text-fg">{last.matched ?? 'None used'} <Badge tone={last.match === 'strong' ? 'ok' : last.match === 'weak' ? 'warn' : 'bad'} className="ml-1">{last.match === 'none' ? 'no match' : last.match + ' match'}</Badge></dd></div>
            <div><dt className="text-xs text-fg3">Collected so far</dt><dd>{Object.keys(last.fields).length ? <ul className="mt-1 space-y-0.5">{Object.entries(last.fields).map(([k, v]) => <li key={k} className="flex justify-between"><span className="text-fg3">{k}</span><span className="font-medium text-fg">{v}</span></li>)}</ul> : <span className="text-fg3">Nothing yet</span>}</dd></div>
            <div><dt className="text-xs text-fg3">Next action</dt><dd className="font-medium text-fg">{last.action ?? 'Continue qualification'}</dd></div>
          </dl>)}
      </Card>
    </div>
  )
}

export function AgentAnalytics() {
  const { row } = useAgent()
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Conversations" value={row.conversations.toLocaleString('en-KE')} hint="all time" href="/app/inbox?filter=ai" />
        <MetricCard label="Resolution rate" value={row.resolutionRate === null ? '—' : pct(row.resolutionRate)} hint="handled without a human" href="/app/analytics/ai" />
        <MetricCard label="Escalations" value={String(row.escalations)} hint="handed to the team" href="/app/inbox?filter=human" />
        <MetricCard label="Last activity" value={row.lastActivity ? ago(row.lastActivity) : '—'} />
      </div>
      <Card><p className="text-sm text-fg2">Trends, escalation reasons and workload by date range live in <Link className="font-semibold text-accent-ink hover:underline" to="/app/analytics/ai">AI analytics</Link>.</p></Card>
    </div>
  )
}
