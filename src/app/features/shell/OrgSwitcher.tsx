import { Check, ChevronsUpDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ORGS } from '../../data/seed'
import { useSession } from '../../store/session'
import { useOrg } from '../../hooks'
import { Dropdown } from '../../components/ui/Overlay'
import { useUi } from '../../store/ui'

export function OrgSwitcher() {
  const { org } = useOrg()
  const switchOrg = useSession((s) => s.switchOrg), nav = useNavigate(), toast = useUi((s) => s.toast)
  return (
    <Dropdown label="Switch organization" align="left"
      trigger={<span className="flex h-9 max-w-56 items-center gap-2 rounded-lg border border-edge bg-panel px-2.5 text-sm font-semibold text-fg hover:bg-sunk">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-fg text-[10px] font-bold text-canvas" aria-hidden>{org.name[0]}</span>
        <span className="hidden truncate sm:block">{org.name}</span><ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-fg3" aria-hidden />
      </span>}
      items={ORGS.map((o) => ({ label: o.name, hint: o.id === org.id ? '✓' : o.plan, icon: o.id === org.id ? <Check className="h-4 w-4" /> : <span className="block h-4 w-4" />, onSelect: () => { if (o.id !== org.id) { switchOrg(o.id); nav('/app/overview'); toast({ tone: 'info', title: `Switched to ${o.name}`, body: 'Data is isolated per organization.' }) } } }))} />
  )
}
