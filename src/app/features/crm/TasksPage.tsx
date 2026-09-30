import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Page } from '../../layouts/Page'
import { useOrg, usePermission, useQs, useService } from '../../hooks'
import { listTasks } from '../../services/crm'
import { useDb } from '../../store/db'
import { useUi } from '../../store/ui'
import { Badge, Card, PageHeader, Tabs } from '../../components/ui/Display'
import { Button } from '../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { Owner } from '../../components/domain/Common'
import { cx, dueLabel } from '../../lib/format'

const VIEWS = [['all', 'List'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['overdue', 'Overdue'], ['done', 'Done']] as const

export default function TasksPage() {
  const { orgId } = useOrg(), qs = useQs(), setQC = useUi((s) => s.setQuickCreate), canWrite = usePermission('crm.write')
  const view = qs.get('view', 'all')
  const { data, error, refetch } = useService('tasks', () => listTasks(orgId, { view }), [view])
  return (
    <Page>
      <title>Tasks · VEYA CRM</title>
      <PageHeader title="Tasks" sub="Follow-ups created by your team and by workflows" actions={<Button variant="accent" icon={<Plus className="h-4 w-4" />} disabled={!canWrite} onClick={() => setQC('task')}>New task</Button>}
        tabs={<Tabs label="Task views" active={view} onChange={(v) => qs.set({ view: v === 'all' ? undefined : v })} tabs={VIEWS.map(([id, label]) => ({ id, label, count: data?.counts[id] }))} />} />
      <Card pad={false}>
        {error ? <ErrorState error={error} onRetry={refetch} /> : !data ? <div className="p-4"><LoadingState rows={6} label="Loading tasks" /></div> : data.items.length === 0 ? (
          <EmptyState title={view === 'overdue' ? 'Nothing overdue' : view === 'all' ? 'No tasks yet' : `No ${view} tasks`} body={view === 'all' ? 'Tasks appear here when your team or a workflow creates a follow-up.' : 'You are all caught up for this view.'} action={<Button variant="accent" onClick={() => setQC('task')}>New task</Button>} />
        ) : (
          <ul className="divide-y divide-edge">
            {data.items.map((t) => {
              const overdue = t.status === 'open' && t.dueAt < new Date().setHours(0, 0, 0, 0)
              return (
                <li key={t.id} className="flex items-start gap-3 px-4 py-3.5">
                  <input type="checkbox" checked={t.status === 'done'} disabled={!canWrite} onChange={() => useDb.getState().toggleTask(t.id)} aria-label={`Mark done: ${t.title}`} className="mt-1 h-4 w-4 shrink-0 accent-[var(--c-accent)]" />
                  <div className="min-w-0 flex-1">
                    <p className={cx('text-sm font-medium', t.status === 'done' ? 'text-fg3 line-through' : 'text-fg')}>{t.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg3">
                      <span className={overdue ? 'font-semibold text-bad' : ''}>{t.status === 'done' ? 'Done' : dueLabel(t.dueAt)}</span>
                      {t.leadId && <Link to={`/app/crm/leads/${t.leadId}`} className="text-accent-ink hover:underline">Lead #{t.leadNumber}{t.customerName ? ` · ${t.customerName}` : ''}</Link>}
                    </p>
                  </div>
                  <Badge tone={t.priority === 'high' ? 'bad' : t.priority === 'medium' ? 'warn' : 'neutral'}>{t.priority}</Badge>
                  <span className="hidden w-36 text-sm text-fg2 sm:block"><Owner id={t.assigneeId} name={t.assigneeName} /></span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </Page>
  )
}
