import { lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import AppShell from './layouts/AppShell'

// Everything is lazy so the marketing bundle never pays for the platform, and each module ships as its own chunk.
const named = <M,>(f: () => Promise<M>, k: keyof M) => lazy(async () => ({ default: (await f())[k] as unknown as React.ComponentType }))

const Login = lazy(() => import('./pages/Login'))
const Overview = lazy(() => import('./pages/Overview'))
const Inbox = lazy(() => import('./features/inbox/InboxPage'))
const crm = () => import('./features/crm/Contacts')
const Leads = lazy(() => import('./features/crm/Leads'))
const LeadDetail = lazy(() => import('./features/crm/LeadDetail'))
const Contacts = named(crm, 'Contacts'), ContactDetail = named(crm, 'ContactDetail'), Companies = named(crm, 'Companies'), CompanyDetail = named(crm, 'CompanyDetail')
const Pipeline = lazy(() => import('./features/crm/PipelinePage'))
const Tasks = lazy(() => import('./features/crm/TasksPage'))
const agent = () => import('./features/agent/AgentPages')
const AgentList = named(agent, 'AgentList'), AgentLayout = named(agent, 'AgentLayout'), AgentGeneral = named(agent, 'AgentGeneral'), AgentBehavior = named(agent, 'AgentBehavior')
const AgentKnowledge = named(agent, 'AgentKnowledge'), AgentTest = named(agent, 'AgentTest'), AgentAnalytics = named(agent, 'AgentAnalytics'), KnowledgePage = named(agent, 'KnowledgePage')
const flows = () => import('./features/flows/FlowPages')
const FlowsList = named(flows, 'FlowsList'), Templates = named(flows, 'Templates'), WorkflowDetail = named(flows, 'WorkflowDetail'), Runs = named(flows, 'Runs'), RunDetail = named(flows, 'RunDetail')
const Builder = lazy(() => import('./features/flows/Builder'))
const an = () => import('./features/analytics/AnalyticsPages')
const AnOverview = named(an, 'AnalyticsOverview'), AnSales = named(an, 'SalesAnalytics'), AnCustomers = named(an, 'CustomerAnalytics'), AnAutomation = named(an, 'AutomationAnalytics'), AnAi = named(an, 'AiAnalytics')
const st = () => import('./features/settings/SettingsPages')
const SettingsLayout = named(st, 'SettingsLayout'), SOrg = named(st, 'OrganizationSettings'), SProfile = named(st, 'ProfileSettings'), STeam = named(st, 'TeamSettings'), SRoles = named(st, 'RolesSettings')
const SChannels = named(st, 'ChannelSettings'), SInt = named(st, 'IntegrationSettings'), SAi = named(st, 'AiSettings'), SNotif = named(st, 'NotificationSettings'), SBilling = named(st, 'BillingSettings'), SSec = named(st, 'SecuritySettings'), SAudit = named(st, 'AuditSettings')
const NotFound = lazy(() => import('./pages/NotFound'))

export const appRoutes = (
  <>
    <Route path="/app/login" element={<Login />} />
    <Route path="/app" element={<AppShell />}>
      <Route index element={<Navigate to="overview" replace />} />
      <Route path="overview" element={<Overview />} />
      <Route path="inbox" element={<Inbox />} />
      <Route path="inbox/:conversationId" element={<Inbox />} />

      <Route path="crm" element={<Navigate to="leads" replace />} />
      <Route path="crm/leads" element={<Leads />} />
      <Route path="crm/leads/:id" element={<LeadDetail />} />
      <Route path="crm/contacts" element={<Contacts />} />
      <Route path="crm/contacts/:id" element={<ContactDetail />} />
      <Route path="crm/companies" element={<Companies />} />
      <Route path="crm/companies/:id" element={<CompanyDetail />} />
      <Route path="crm/pipeline" element={<Pipeline />} />
      <Route path="crm/tasks" element={<Tasks />} />

      <Route path="agent" element={<AgentList />} />
      <Route path="agent/knowledge" element={<KnowledgePage />} />
      <Route path="agent/:id" element={<AgentLayout />}>
        <Route index element={<AgentGeneral />} />
        <Route path="behavior" element={<AgentBehavior />} />
        <Route path="knowledge" element={<AgentKnowledge />} />
        <Route path="test" element={<AgentTest />} />
        <Route path="analytics" element={<AgentAnalytics />} />
        <Route path="settings" element={<Navigate to=".." replace />} />
      </Route>

      <Route path="flows" element={<FlowsList />} />
      <Route path="flows/templates" element={<Templates />} />
      <Route path="flows/runs" element={<Runs />} />
      <Route path="flows/runs/:id" element={<RunDetail />} />
      <Route path="flows/:id" element={<WorkflowDetail />} />
      <Route path="flows/:id/builder" element={<Builder />} />

      <Route path="analytics" element={<AnOverview />} />
      <Route path="analytics/sales" element={<AnSales />} />
      <Route path="analytics/customers" element={<AnCustomers />} />
      <Route path="analytics/automation" element={<AnAutomation />} />
      <Route path="analytics/ai" element={<AnAi />} />

      <Route path="settings" element={<SettingsLayout />}>
        <Route index element={<SOrg />} />
        <Route path="profile" element={<SProfile />} />
        <Route path="team" element={<STeam />} />
        <Route path="roles" element={<SRoles />} />
        <Route path="channels" element={<SChannels />} />
        <Route path="integrations" element={<SInt />} />
        <Route path="ai" element={<SAi />} />
        <Route path="notifications" element={<SNotif />} />
        <Route path="billing" element={<SBilling />} />
        <Route path="security" element={<SSec />} />
        <Route path="audit" element={<SAudit />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  </>
)
