import { useCallback, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow, type Connection, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AlertTriangle, ArrowLeft, CheckCircle2, FlaskConical, Play, Trash2 } from 'lucide-react'
import { useOrg, useMedia, usePermission, useService, useUnsavedWarning } from '../../hooks'
import { getWorkflow } from '../../services/flows'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { useSession } from '../../store/session'
import { NODE_CATALOG, makeNodeData, nodeDef } from '../../lib/flowCatalog'
import { FLOW_ICONS, nodeTypes, type FlowNode } from '../../components/domain/WorkflowNode'
import { toFlowEdges } from '../../components/domain/WorkflowCanvas'
import { StatusBadge } from '../../components/ui/Display'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Form'
import { InlineEdit } from '../../components/ui/InlineEdit'
import { ErrorState, LoadingState, NoPermission } from '../../components/ui/States'
import type { WFEdge, WFNode, Workflow } from '../../types'

const fromFlow = (nodes: FlowNode[], edges: Edge[]): { nodes: WFNode[]; edges: WFEdge[] } => ({
  nodes: nodes.map((n) => ({ id: n.id, type: n.type as WFNode['type'], position: { x: Math.round(n.position.x), y: Math.round(n.position.y) }, data: { kind: n.data.kind, label: n.data.label, params: n.data.params } })),
  edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle ?? null, label: typeof e.label === 'string' ? e.label : undefined })),
})

export function validate(nodes: WFNode[], edges: WFEdge[]): string[] {
  const issues: string[] = []
  const triggers = nodes.filter((n) => n.type === 'trigger')
  if (triggers.length !== 1) issues.push(triggers.length === 0 ? 'Add a trigger to start the workflow.' : 'A workflow can only have one trigger.')
  nodes.forEach((n) => {
    if (n.type !== 'trigger' && !edges.some((e) => e.target === n.id)) issues.push(`“${n.data.label}” is not connected to anything before it.`)
    if (n.type !== 'end' && !edges.some((e) => e.source === n.id)) issues.push(`“${n.data.label}” needs a next step or an End.`)
    if (n.type === 'condition') for (const h of ['yes', 'no']) if (!edges.some((e) => e.source === n.id && e.sourceHandle === h)) issues.push(`“${n.data.label}” is missing its ${h.toUpperCase()} branch.`)
  })
  return issues
}

function BuilderInner({ wf }: { wf: Workflow }) {
  const toast = useUi((s) => s.toast), theme = useSession((s) => s.theme)
  const editable = useMedia('(min-width: 1024px)')
  const rf = useReactFlow<FlowNode, Edge>()
  const wrap = useRef<HTMLDivElement>(null)
  const [name, setName] = useState(wf.name)
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(wf.nodes as FlowNode[])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(toFlowEdges(wf.edges))
  const [selected, setSelected] = useState<string | null>(null)
  const saved = useRef(JSON.stringify({ ...fromFlow(wf.nodes as FlowNode[], toFlowEdges(wf.edges)), name: wf.name }))
  const current = useMemo(() => fromFlow(nodes, edges), [nodes, edges])
  const dirty = JSON.stringify({ ...current, name }) !== saved.current
  const issues = useMemo(() => validate(current.nodes, current.edges), [current])
  useUnsavedWarning(dirty)

  const onConnect = useCallback((c: Connection) => {
    setEdges((es) => {
      const edge: WFEdge = { id: `${c.source}-${c.target}-${Date.now().toString(36)}`, source: c.source, target: c.target, sourceHandle: c.sourceHandle ?? null, label: c.sourceHandle === 'yes' ? 'Yes' : c.sourceHandle === 'no' ? 'No' : undefined }
      // one outgoing edge per handle keeps branches unambiguous
      return [...es.filter((e) => !(e.source === c.source && (e.sourceHandle ?? null) === (c.sourceHandle ?? null))), ...toFlowEdges([edge])]
    })
  }, [setEdges])

  const add = (kind: string, at?: { x: number; y: number }) => {
    const def = nodeDef(kind)!
    const id = `n${Date.now().toString(36)}`
    const pos = at ?? (() => { const b = wrap.current!.getBoundingClientRect(); return rf.screenToFlowPosition({ x: b.left + b.width / 2 - 112, y: b.top + b.height / 2 - 40 }) })()
    setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), { id, type: def.type, position: pos, data: makeNodeData(kind), selected: true }])
    setSelected(id)
  }
  const sel = nodes.find((n) => n.id === selected)
  const def = sel ? nodeDef(sel.data.kind) : undefined
  const patchNode = (id: string, fn: (d: FlowNode['data']) => FlowNode['data']) => setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data: fn(n.data) } : n)))

  const save = (status?: Workflow['status']) => {
    useDb.getState().updateWorkflow(wf.id, { name: name.trim() || wf.name, ...current, ...(status ? { status } : {}) })
    saved.current = JSON.stringify({ ...current, name })
    toast({ tone: 'success', title: status === 'active' ? 'Workflow activated' : 'Workflow saved' })
  }
  const test = () => {
    save()
    const s = useDb.getState()
    const lead = s.leads.filter((l) => l.orgId === wf.orgId).sort((a, b) => b.createdAt - a.createdAt)[0]
    const run = useDb.getState().triggerWorkflow(wf.id, { leadId: lead?.id, customerId: lead?.customerId })
    if (run) toast({ tone: run.status === 'failed' ? 'error' : 'success', title: `Test run ${run.status}`, body: `Used the most recent lead. ${run.steps.length} steps executed.`, href: `/app/flows/runs/${run.id}`, action: 'Inspect run' })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-edge bg-panel px-3 py-2 sm:px-4">
        <Link to={`/app/flows/${wf.id}`} onClick={(e) => { if (dirty && !window.confirm('Discard unsaved changes?')) e.preventDefault() }} aria-label="Back to workflow" className="rounded-lg p-1.5 text-fg2 hover:bg-sunk"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="w-56 max-w-full text-base font-semibold"><InlineEdit label="Workflow name" value={name} disabled={!editable} onSave={(v) => v && setName(v)} className="text-base font-semibold" /></div>
        <StatusBadge status={wf.status} />
        {dirty ? <span role="status" className="text-xs font-medium text-warn">Unsaved changes</span> : <span className="text-xs text-fg3">All changes saved</span>}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" icon={<FlaskConical className="h-3.5 w-3.5" />} disabled={!editable || issues.length > 0} onClick={test} title={issues.length ? 'Fix the issues first' : undefined}>Save &amp; test run</Button>
          <Button size="sm" disabled={!dirty || !editable} onClick={() => save()}>Save</Button>
          {wf.status === 'active' ? <Button size="sm" onClick={() => { useDb.getState().updateWorkflow(wf.id, { status: 'paused' }); toast({ tone: 'info', title: 'Workflow paused' }) }}>Pause</Button>
            : <Button size="sm" variant="accent" icon={<Play className="h-3.5 w-3.5" />} disabled={issues.length > 0 || !editable} onClick={() => { save('active') }}>Activate</Button>}
        </div>
      </div>
      {!editable && <p className="border-b border-warn/30 bg-warn-soft px-4 py-2 text-[13px] text-warn">Editing works best on a larger screen. You can pan and zoom to review this workflow here.</p>}
      <div className="flex min-h-0 flex-1">
        {editable && (
          <aside aria-label="Node library" className="scroll-thin hidden w-60 shrink-0 overflow-y-auto border-r border-edge bg-panel p-3 lg:block">
            {['Triggers', 'Conditions', 'Actions'].map((g) => (
              <div key={g} className="mb-4"><h2 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-fg3">{g}</h2>
                <ul className="space-y-1">{NODE_CATALOG.filter((n) => n.group === g).map((n) => { const I = FLOW_ICONS[n.icon]; return (
                  <li key={n.kind}><button type="button" draggable onDragStart={(e) => { e.dataTransfer.setData('application/veya-node', n.kind); e.dataTransfer.effectAllowed = 'move' }} onClick={() => add(n.kind)} title={n.description}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left text-[13px] font-medium text-fg2 hover:border-edge hover:bg-sunk hover:text-fg"><I className="h-4 w-4 text-fg3" aria-hidden />{n.label}</button></li>) })}
                  {g === 'Actions' && <li><button type="button" onClick={() => { const id = `e${Date.now().toString(36)}`; setNodes((ns) => [...ns, { id, type: 'end', position: rf.screenToFlowPosition({ x: (wrap.current?.getBoundingClientRect().left ?? 0) + 300, y: (wrap.current?.getBoundingClientRect().top ?? 0) + 200 }), data: { kind: 'end', label: 'End', params: {} } }]) }} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium text-fg2 hover:bg-sunk">End</button></li>}
                </ul></div>))}
          </aside>
        )}
        <div ref={wrap} className="min-w-0 flex-1" onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }} onDrop={(e) => { const k = e.dataTransfer.getData('application/veya-node'); if (k && editable) { e.preventDefault(); add(k, rf.screenToFlowPosition({ x: e.clientX - 112, y: e.clientY - 20 })) } }}>
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodesDraggable={editable} nodesConnectable={editable} elementsSelectable={editable}
            onSelectionChange={({ nodes: s }) => setSelected(s[0]?.id ?? null)} deleteKeyCode={editable ? ['Backspace', 'Delete'] : null} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.25} proOptions={{ hideAttribution: true }} colorMode={theme} snapToGrid snapGrid={[10, 10]}>
            <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--c-edge2)" /><Controls showInteractive={false} /><MiniMap pannable zoomable className="!hidden md:!block" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-edge)', borderRadius: 8 }} nodeColor="var(--c-edge2)" maskColor="rgb(120 120 140 / 0.12)" />
          </ReactFlow>
        </div>
        {editable && (
          <aside aria-label="Node settings" className="scroll-thin hidden w-72 shrink-0 overflow-y-auto border-l border-edge bg-panel p-4 xl:block">
            {sel && def ? (
              <div className="space-y-4">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-fg3">{sel.type}</p><h2 className="text-sm font-semibold text-fg">{def.label}</h2><p className="mt-1 text-xs text-fg2">{def.description}</p></div>
                <Field label="Label">{(id) => <Input id={id} value={sel.data.label} onChange={(e) => patchNode(sel.id, (d) => ({ ...d, label: e.target.value }))} />}</Field>
                {def.params.map((p) => (
                  <Field key={p.key} label={p.label}>{(id) => p.options
                    ? <Select id={id} value={sel.data.params[p.key] ?? ''} onChange={(e) => patchNode(sel.id, (d) => ({ ...d, params: { ...d.params, [p.key]: e.target.value } }))}>{p.options.map((o) => <option key={o}>{o}</option>)}</Select>
                    : <Input id={id} value={sel.data.params[p.key] ?? ''} placeholder={p.placeholder} onChange={(e) => patchNode(sel.id, (d) => ({ ...d, params: { ...d.params, [p.key]: e.target.value } }))} />}</Field>))}
                {def.params.some((p) => /\{\{/.test(p.placeholder ?? '')) && <p className="text-xs text-fg3">Use {'{{customer}}'} to insert the customer's first name.</p>}
                <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => { setNodes((ns) => ns.filter((n) => n.id !== sel.id)); setEdges((es) => es.filter((e) => e.source !== sel.id && e.target !== sel.id)); setSelected(null) }}>Delete node</Button>
              </div>
            ) : (
              <div className="space-y-3"><h2 className="text-sm font-semibold text-fg">Checks</h2>
                {issues.length === 0 ? <p className="flex items-center gap-2 text-sm text-ok"><CheckCircle2 className="h-4 w-4" aria-hidden />Ready to activate</p>
                  : <ul className="space-y-2">{issues.map((i) => <li key={i} className="flex gap-2 text-[13px] text-warn"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{i}</li>)}</ul>}
                <p className="border-t border-edge pt-3 text-xs text-fg3">Select a node to edit it. Drag from a node's bottom handle to connect. Press Delete to remove the selection.</p></div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

export default function Builder() {
  const { id = '' } = useParams(), { orgId } = useOrg(), can = usePermission('flows.manage')
  const { data, error, refetch } = useService(`wf-builder-${id}`, () => getWorkflow(orgId, id), [id])
  if (!can) return <NoPermission what="The workflow builder" />
  if (error) return <ErrorState error={error} onRetry={refetch} back={{ to: '/app/flows', label: 'Back to workflows' }} />
  if (!data) return <div className="p-6"><LoadingState rows={5} label="Loading builder" /></div>
  // Remount the editor only when switching workflows; saved edits should not reset local canvas state.
  return <div className="h-[calc(100svh-3.5rem)]"><title>{`${data.name} · Builder · VEYA Flow`}</title><ReactFlowProvider key={data.id}><BuilderInner wf={data} /></ReactFlowProvider></div>
}
