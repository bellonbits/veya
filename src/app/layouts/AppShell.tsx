import { Suspense, useMemo } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, CircleHelp, Home, Inbox, ListChecks, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Play, Plus, Search, Sun, Target, UserRound, UserPlus, MessageSquarePlus, Workflow, MoreHorizontal } from 'lucide-react'
import { Wordmark, VeyaMark } from '../../components/Logo'
import { useDb } from '../store/db'
import { useSession } from '../store/session'
import { useUi } from '../store/ui'
import { useStory } from '../store/story'
import { useOrg } from '../hooks'
import { can, ROLE_LABEL } from '../lib/permissions'
import { cx } from '../lib/format'
import type { Role } from '../types'
import { NAV } from './nav'
import { Boundary } from './Page'
import { Avatar, Kbd } from '../components/ui/Display'
import { Dropdown, Drawer } from '../components/ui/Overlay'
import { LoadingState } from '../components/ui/States'
import { Toaster } from '../components/ui/Toaster'
import { OrgSwitcher } from '../features/shell/OrgSwitcher'
import { CommandPalette } from '../features/shell/CommandPalette'
import { NotificationPanel, useUnread } from '../features/shell/NotificationPanel'
import { QuickCreateModal } from '../features/shell/QuickCreateModal'
import { StoryTracker } from '../features/shell/StoryTracker'

function useInboxUnread() {
  const { orgId } = useOrg()
  return useDb((s) => s.conversations.filter((c) => c.orgId === orgId && c.status === 'open' && c.unread > 0).length)
}

function SidebarNav({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { role } = useOrg(), unread = useInboxUnread()
  return (
    <nav aria-label="Primary" className="scroll-thin flex-1 overflow-y-auto px-2 pb-4">
      {NAV.map((sec, i) => {
        const items = sec.items.filter((n) => !n.perm || can(role, n.perm))
        if (!items.length) return null
        return (
          <div key={i} className={cx(i > 0 && 'mt-4 border-t border-edge pt-3')}>
            {sec.title && !collapsed && <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-fg3">{sec.title}</p>}
            <ul className="space-y-0.5">
              {items.map((n) => (
                <li key={n.to}>
                  <NavLink to={n.to} end={n.end} onClick={onNavigate} title={collapsed ? n.label : undefined}
                    className={({ isActive }) => cx('group flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13.5px] font-medium transition', collapsed && 'justify-center px-0', isActive ? 'bg-accent-soft text-accent-ink' : 'text-fg2 hover:bg-sunk hover:text-fg')}>
                    <n.icon className="h-[17px] w-[17px] shrink-0" aria-hidden />
                    {!collapsed && <span className="flex-1 truncate">{n.label}</span>}
                    {n.to === '/app/inbox' && unread > 0 && !collapsed && <span className="num rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white"><span className="sr-only">{unread} unread </span>{unread}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

function TopBar() {
  const { org, user, role } = useOrg()
  const { setPalette, setNotifications, setQuickCreate, setMobileNav } = useUi()
  const { theme, toggleTheme, signOut, setRole } = useSession()
  const unread = useUnread(), nav = useNavigate(), startStory = useStory((s) => s.start), toast = useUi((s) => s.toast)
  const roles: Role[] = ['owner', 'admin', 'manager', 'agent', 'viewer']
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-edge bg-panel/90 px-3 backdrop-blur sm:px-4">
      <button type="button" aria-label="Open menu" className="rounded-lg p-2 text-fg2 hover:bg-sunk md:hidden" onClick={() => setMobileNav(true)}><Menu className="h-5 w-5" /></button>
      <OrgSwitcher />
      <button type="button" onClick={() => setPalette(true)} aria-label="Search (Ctrl K)" className="ml-1 hidden h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-edge bg-canvas px-3 text-sm text-fg3 transition hover:border-edge2 sm:flex sm:max-w-md">
        <Search className="h-4 w-4" aria-hidden /><span className="flex-1 truncate text-left">Search customers, leads, conversations…</span><Kbd>⌘K</Kbd>
      </button>
      <div className="flex-1 sm:hidden" />
      <button type="button" aria-label="Search" onClick={() => setPalette(true)} className="rounded-lg p-2 text-fg2 hover:bg-sunk sm:hidden"><Search className="h-[18px] w-[18px]" /></button>
      <Dropdown label="Quick create" trigger={<span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-fg px-3 text-sm font-semibold text-canvas hover:opacity-90"><Plus className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">Create</span></span>}
        items={[
          { label: 'New lead', icon: <Target className="h-4 w-4" />, onSelect: () => setQuickCreate('lead') }, { label: 'New contact', icon: <UserPlus className="h-4 w-4" />, onSelect: () => setQuickCreate('contact') },
          { label: 'New conversation', icon: <MessageSquarePlus className="h-4 w-4" />, onSelect: () => setQuickCreate('conversation') }, { label: 'New workflow', icon: <Workflow className="h-4 w-4" />, onSelect: () => setQuickCreate('workflow'), disabled: !can(role, 'flows.manage') },
          { label: 'New task', icon: <ListChecks className="h-4 w-4" />, onSelect: () => setQuickCreate('task') },
        ]} />
      <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => setNotifications(true)} className="relative rounded-lg p-2 text-fg2 hover:bg-sunk">
        <Bell className="h-[18px] w-[18px]" />{unread > 0 && <span className="num absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      <Dropdown label="Help" trigger={<span className="hidden rounded-lg p-2 text-fg2 hover:bg-sunk sm:block"><CircleHelp className="h-[18px] w-[18px]" /></span>}
        items={[
          { label: 'Simulate a customer inquiry', icon: <Play className="h-4 w-4" />, onSelect: () => { nav('/app/overview'); startStory() } },
          { label: 'Command palette', hint: '⌘K', onSelect: () => setPalette(true) },
          { label: 'Keyboard shortcuts', onSelect: () => toast({ tone: 'info', title: 'Shortcuts', body: '⌘K command palette · / search · Esc close · ↑ ↓ navigate lists' }) },
          'sep', { label: 'Contact support', onSelect: () => { window.location.href = 'mailto:hello@veya.tech' } },
        ]} />
      <Dropdown label="Account menu" trigger={<Avatar name={user.name} hue={user.hue} size={32} />}
        items={[
          { label: `${user.name} · ${ROLE_LABEL[role]}`, disabled: true, icon: <UserRound className="h-4 w-4" />, onSelect: () => {} }, 'sep',
          { label: theme === 'light' ? 'Dark mode' : 'Light mode', icon: theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />, onSelect: toggleTheme },
          'sep', ...roles.map((r) => ({ label: `View as ${ROLE_LABEL[r]}`, hint: r === role ? '✓' : '', onSelect: () => { setRole(r === user.role ? undefined : r); toast({ tone: 'info', title: `Now viewing as ${ROLE_LABEL[r]}`, body: 'Navigation and actions follow this role. Demo only.' }) } })),
          'sep', { label: 'Sign out', icon: <LogOut className="h-4 w-4" />, danger: true, onSelect: () => { signOut(); nav('/app/login') } },
        ]} />
      <span className="sr-only">Workspace: {org.name}</span>
    </header>
  )
}

function BottomNav() {
  const unread = useInboxUnread(), setMobileNav = useUi((s) => s.setMobileNav)
  const item = 'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold'
  const cls = ({ isActive }: { isActive: boolean }) => cx(item, isActive ? 'text-accent-ink' : 'text-fg3')
  return (
    <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-edge bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <NavLink to="/app/overview" className={cls}><Home className="h-5 w-5" aria-hidden />Home</NavLink>
      <NavLink to="/app/inbox" className={cls}><span className="relative"><Inbox className="h-5 w-5" aria-hidden />{unread > 0 && <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-accent"><span className="sr-only">unread</span></span>}</span>Inbox</NavLink>
      <NavLink to="/app/crm/leads" className={cls}><Target className="h-5 w-5" aria-hidden />Leads</NavLink>
      <NavLink to="/app/crm/tasks" className={cls}><ListChecks className="h-5 w-5" aria-hidden />Tasks</NavLink>
      <button type="button" onClick={() => setMobileNav(true)} className={cx(item, 'text-fg3')}><MoreHorizontal className="h-5 w-5" aria-hidden />More</button>
    </nav>
  )
}

export default function AppShell() {
  const signedIn = useSession((s) => s.signedIn), theme = useSession((s) => s.theme), collapsed = useSession((s) => s.navCollapsed), toggleNav = useSession((s) => s.toggleNav)
  const mobileNav = useUi((s) => s.mobileNavOpen), setMobileNav = useUi((s) => s.setMobileNav)
  const { pathname } = useLocation()
  const full = useMemo(() => /^\/app\/(inbox|flows\/[^/]+\/builder)/.test(pathname), [pathname])
  if (!signedIn) return <Navigate to="/app/login" replace />
  return (
    <div className="app min-h-svh" data-theme={theme}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-fg focus:px-3 focus:py-2 focus:text-canvas">Skip to content</a>
      <aside className={cx('fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-edge bg-panel transition-[width] md:flex', collapsed ? 'w-16' : 'w-60')}>
        <div className={cx('flex h-14 items-center', collapsed ? 'justify-center' : 'justify-between px-4')}>
          <Link to="/app/overview" aria-label="VEYA overview" className="rounded">{collapsed ? <VeyaMark className="h-6 w-auto brightness-0 dark:invert" /> : <Wordmark tone="dark" className={theme === 'dark' ? 'brightness-0 invert' : ''} />}</Link>
        </div>
        <SidebarNav collapsed={collapsed} />
        <button type="button" onClick={toggleNav} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="m-2 flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-medium text-fg3 hover:bg-sunk hover:text-fg">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" />Collapse</>}
        </button>
      </aside>
      <Drawer open={mobileNav} onClose={() => setMobileNav(false)} title="VEYA" side="left"><SidebarNav onNavigate={() => setMobileNav(false)} /></Drawer>
      <div className={cx('flex min-h-svh flex-col transition-[padding]', collapsed ? 'md:pl-16' : 'md:pl-60')}>
        <TopBar />
        <main id="main" tabIndex={-1} className={cx('flex-1 focus:outline-none', full ? 'md:h-[calc(100svh-3.5rem)] md:overflow-hidden' : 'pb-20 md:pb-8')}>
          <Boundary key={pathname.split('/').slice(0, 4).join('/')}>
            <Suspense fallback={<div className="p-6"><LoadingState /></div>}><div key={pathname} className={cx('page-in', full && 'h-full')}><Outlet /></div></Suspense>
          </Boundary>
        </main>
      </div>
      <BottomNav />
      <CommandPalette /><NotificationPanel /><QuickCreateModal /><StoryTracker /><Toaster />
    </div>
  )
}
