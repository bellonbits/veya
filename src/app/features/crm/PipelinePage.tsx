import { useState } from 'react'
import { Page } from '../../layouts/Page'
import { useOrg, usePermission, useService } from '../../hooks'
import { pipelineAll } from '../../services/crm'
import { orgUsers } from '../../services/common'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { PageHeader } from '../../components/ui/Display'
import { Select } from '../../components/ui/Form'
import { ErrorState, LoadingState, EmptyState } from '../../components/ui/States'
import { PipelineColumn } from '../../components/domain/Pipeline'
import { STATUS_ORDER, type LeadStatus } from '../../types'
import { cap, kes } from '../../lib/format'
import { Button } from '../../components/ui/Button'

export default function PipelinePage() {
  const { orgId } = useOrg(), canWrite = usePermission('crm.write'), toast = useUi((s) => s.toast), setQC = useUi((s) => s.setQuickCreate)
  const [owner, setOwner] = useState('')
  const { data, error, refetch } = useService('pipeline', () => pipelineAll(orgId, owner || undefined), [owner])
  const move = (id: string, to: LeadStatus) => {
    if (!canWrite) { toast({ tone: 'error', title: 'Your role cannot move leads' }); return }
    const l = useDb.getState().leads.find((x) => x.id === id)
    if (!l || l.status === to) return
    useDb.getState().updateLead(id, { status: to })
    toast({ tone: 'success', title: `Lead #${l.number} moved`, body: `${cap(l.status)} → ${cap(to)}. Logged to the lead's activity and audit trail.`, href: `/app/crm/leads/${id}`, action: 'Open lead' })
  }
  const open = data?.filter((l) => l.status !== 'won' && l.status !== 'lost') ?? []
  return (
    <Page wide>
      <title>Pipeline · VEYA CRM</title>
      <PageHeader title="Pipeline" sub={data ? `${open.length} open leads · ${kes(open.reduce((a, l) => a + l.value, 0))} open value. Drag cards between stages.` : 'Drag cards between stages'}
        actions={<Select aria-label="Filter by owner" value={owner} onChange={(e) => setOwner(e.target.value)} className="w-44"><option value="">All owners</option><option value="none">Unassigned</option>{orgUsers(orgId).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>} />
      {error ? <ErrorState error={error} onRetry={refetch} /> : !data ? <LoadingState rows={5} label="Loading pipeline" /> : data.length === 0 ? <EmptyState title="No leads yet" body="Your leads will appear here when customers begin interacting with your business." action={<Button variant="accent" onClick={() => setQC('lead')}>Create lead</Button>} /> : (
        <div className="scroll-thin -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
          {STATUS_ORDER.map((s) => <PipelineColumn key={s} status={s} leads={data.filter((l) => l.status === s)} onMove={move} />)}
        </div>
      )}
    </Page>
  )
}
