import { useMemo } from 'react'
import { Background, BackgroundVariant, Controls, MarkerType, ReactFlow, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { WFEdge, WFNode } from '../../types'
import { nodeTypes, type FlowNode } from './WorkflowNode'
import { useSession } from '../../store/session'

export const toFlowEdges = (edges: WFEdge[]): Edge[] => edges.map((e) => ({
  id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? undefined, label: e.label, type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 }, style: { strokeWidth: 1.6, stroke: e.sourceHandle === 'yes' ? 'var(--c-ok)' : e.sourceHandle === 'no' ? 'var(--c-bad)' : 'var(--c-fg3)' },
  labelStyle: { fontSize: 11, fontWeight: 700, fill: 'var(--c-fg2)' }, labelBgStyle: { fill: 'var(--c-panel)' },
}))

/** Read-only canvas. `status` colours nodes by what happened in a run. */
export function WorkflowCanvasView({ nodes, edges, status, height = 420 }: { nodes: WFNode[]; edges: WFEdge[]; status?: Record<string, 'completed' | 'failed' | 'waiting' | 'skipped'>; height?: number }) {
  const theme = useSession((s) => s.theme)
  const fn = useMemo<FlowNode[]>(() => nodes.map((n) => ({ ...n, data: { ...n.data, status: status ? status[n.id] ?? 'idle' : undefined }, draggable: false, connectable: false })), [nodes, status])
  const fe = useMemo(() => toFlowEdges(edges), [edges])
  return (
    <div style={{ height }} className="overflow-hidden rounded-xl border border-edge" role="figure" aria-label="Workflow diagram">
      <ReactFlow nodes={fn} edges={fe} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.15 }} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} minZoom={0.3} proOptions={{ hideAttribution: true }} colorMode={theme}>
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--c-edge2)" /><Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
