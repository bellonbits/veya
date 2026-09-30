import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { ArrowRightLeft, BellRing, Bot, CalendarClock, Clock, FileText, Flag, Gauge, GitBranch, Hourglass, ListTodo, Mail, MessageSquarePlus, MessageSquareText, PencilLine, Send, Sparkles, Square, Tag, Target, User, UserCheck, UserCog, UserPen, UserPlus, Webhook, type LucideIcon } from 'lucide-react'
import type { WFNodeData } from '../../types'
import { nodeDef } from '../../lib/flowCatalog'
import { cx } from '../../lib/format'

export const FLOW_ICONS: Record<string, LucideIcon> = { UserPlus, MessageSquarePlus, User, FileText, Tag, ArrowRightLeft, CalendarClock, Webhook, GitBranch, UserCog, Flag, MessageSquareText, Gauge, Clock, Target, PencilLine, Sparkles, ListTodo, UserCheck, Send, Mail, UserPen, Bot, Hourglass, BellRing, Square }

export type FlowNodeData = WFNodeData & { status?: 'completed' | 'failed' | 'waiting' | 'skipped' | 'idle' }
export type FlowNode = Node<FlowNodeData, 'trigger' | 'condition' | 'action' | 'end'>

const TONE = { trigger: 'bg-accent text-white', condition: 'bg-warn-soft text-warn', action: 'bg-sunk text-fg', end: 'bg-sunk text-fg3' }
const RING: Record<string, string> = { completed: 'ring-2 ring-ok', failed: 'ring-2 ring-bad', waiting: 'ring-2 ring-warn', skipped: 'opacity-55', idle: 'opacity-45' }
const STATUS_TEXT: Record<string, string> = { completed: 'Completed', failed: 'Failed', waiting: 'Waiting', skipped: 'Skipped' }

function summary(d: FlowNodeData) {
  const p = d.params
  const v = p.text ?? p.title ?? p.message ?? p.tag ?? p.status ?? p.to ?? p.hours ?? p.strategy ?? p.cron ?? p.value
  if (d.kind === 'cond.if_else' && p.field) return `${p.field} ${p.op} ${p.value}`
  if (d.kind === 'action.wait' && p.hours) return `${p.hours} hours`
  return v ? String(v).slice(0, 44) : nodeDef(d.kind)?.description.slice(0, 44) ?? ''
}

export const WorkflowNode = memo(function WorkflowNode({ data, type, selected }: NodeProps<FlowNode>) {
  const def = nodeDef(data.kind)
  const Icon = FLOW_ICONS[def?.icon ?? 'Square'] ?? Square
  const status = data.status
  const handle = '!h-2.5 !w-2.5 !border-2 !border-panel !bg-fg3'
  return (
    <div className={cx('w-56 rounded-xl border bg-panel px-3 py-2.5 shadow-sm transition', selected ? 'border-accent shadow-md' : 'border-edge', status && RING[status])}
      aria-label={`${type} node: ${data.label}${status ? `, ${STATUS_TEXT[status] ?? ''}` : ''}`}>
      {type !== 'trigger' && <Handle type="target" position={Position.Top} className={handle} />}
      <div className="flex items-center gap-2.5">
        <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', TONE[type ?? 'action'])}><Icon className="h-4 w-4" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-fg3">{type === 'end' ? 'End' : type}</p>
          <p className="truncate text-[13px] font-semibold leading-tight text-fg">{data.label}</p>
        </div>
      </div>
      {type !== 'end' && <p className="mt-1.5 truncate text-xs text-fg3">{summary(data)}</p>}
      {status && STATUS_TEXT[status] && <p className={cx('mt-1.5 text-[11px] font-semibold', status === 'completed' ? 'text-ok' : status === 'failed' ? 'text-bad' : 'text-warn')}>{status === 'completed' ? '✓ ' : status === 'failed' ? '✕ ' : '… '}{STATUS_TEXT[status]}</p>}
      {type === 'condition' ? (
        <>
          <Handle id="yes" type="source" position={Position.Bottom} style={{ left: '28%' }} className={cx(handle, '!bg-ok')} />
          <Handle id="no" type="source" position={Position.Bottom} style={{ left: '72%' }} className={cx(handle, '!bg-bad')} />
          <span className="pointer-events-none absolute -bottom-5 left-[28%] -translate-x-1/2 text-[10px] font-bold text-ok">YES</span>
          <span className="pointer-events-none absolute -bottom-5 left-[72%] -translate-x-1/2 text-[10px] font-bold text-bad">NO</span>
        </>
      ) : type !== 'end' && <Handle type="source" position={Position.Bottom} className={handle} />}
    </div>
  )
})
export const nodeTypes = { trigger: WorkflowNode, condition: WorkflowNode, action: WorkflowNode, end: WorkflowNode }
