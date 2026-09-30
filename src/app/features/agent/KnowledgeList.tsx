import { useState } from 'react'
import { FileText, Globe, HelpCircle, Package, Plus, RefreshCw, Type, Wrench } from 'lucide-react'
import { useOrg, usePermission, useService } from '../../hooks'
import { listKnowledge } from '../../services/flows'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { Card, StatusBadge } from '../../components/ui/Display'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Form'
import { Modal } from '../../components/ui/Overlay'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { ago } from '../../lib/format'
import type { KnowledgeItem } from '../../types'

const ICON = { document: FileText, url: Globe, faq: HelpCircle, text: Type, product: Package, service: Wrench }
const LABEL = { document: 'Document', url: 'Website URL', faq: 'FAQ', text: 'Text', product: 'Products', service: 'Services' }

export function KnowledgeList({ agentId }: { agentId?: string }) {
  const { orgId } = useOrg(), canManage = usePermission('agent.manage'), toast = useUi((s) => s.toast)
  const { data, error, refetch } = useService(`knowledge-${agentId ?? 'all'}`, () => listKnowledge(orgId, agentId), [agentId])
  const [open, setOpen] = useState(false), [type, setType] = useState<KnowledgeItem['type']>('faq'), [title, setTitle] = useState(''), [err, setErr] = useState('')
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setErr(type === 'url' ? 'Enter a web address' : 'Enter a title'); return }
    if (type === 'url' && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}/i.test(title.trim())) { setErr('Enter a valid web address, e.g. example.com/faq'); return }
    useDb.getState().addKnowledge({ title: title.trim(), type, agentId: agentId ?? useDb.getState().agents.find((a) => a.orgId === orgId)?.id })
    toast({ tone: 'info', title: 'Processing source', body: 'It will be available to the agent once status is Ready.' })
    setOpen(false); setTitle(''); setErr('')
  }
  return (
    <>
      <div className="mb-3 flex items-center justify-between"><p className="text-sm text-fg2">Sources the agent can search when answering customers.</p><Button variant="accent" icon={<Plus className="h-4 w-4" />} disabled={!canManage} onClick={() => setOpen(true)}>Add source</Button></div>
      <Card pad={false}>
        {error ? <ErrorState error={error} onRetry={refetch} /> : !data ? <div className="p-4"><LoadingState rows={5} label="Loading knowledge" /></div> : data.length === 0 ? (
          <EmptyState title="Teach your agent about your business" body="Add FAQs, documents, website pages, products and policies. The agent only answers from what you add." action={<Button variant="accent" onClick={() => setOpen(true)}>Add source</Button>} />
        ) : (
          <ul className="divide-y divide-edge">
            {data.map((k) => { const I = ICON[k.type]; return (
              <li key={k.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sunk text-fg2"><I className="h-4 w-4" aria-hidden /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-fg">{k.title}</p><p className="text-xs text-fg3">{LABEL[k.type]} · {k.sizeLabel} · updated {ago(k.updatedAt)}</p>{k.error && <p className="mt-1 text-xs text-bad">{k.error}</p>}</div>
                <StatusBadge status={k.status} />
                {k.status === 'failed' && <Button size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} disabled={!canManage} onClick={() => useDb.getState().retryKnowledge(k.id)}>Retry</Button>}
              </li>) })}
          </ul>
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Add knowledge source" footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="accent" type="submit" form="kn-form">Add source</Button></>}>
        <form id="kn-form" onSubmit={add} noValidate className="space-y-4">
          <Field label="Type">{(id) => <Select id={id} value={type} onChange={(e) => setType(e.target.value as KnowledgeItem['type'])}>{Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>}</Field>
          <Field label={type === 'url' ? 'Web address' : 'Title'} error={err} hint={type === 'document' ? 'File upload arrives with the API; add the document title to track it now.' : undefined}>{(id) => <Input id={id} value={title} onChange={(e) => { setTitle(e.target.value); setErr('') }} invalid={!!err} placeholder={type === 'url' ? 'https://example.com/faq' : 'Viewing and deposit policy'} />}</Field>
        </form>
      </Modal>
    </>
  )
}
