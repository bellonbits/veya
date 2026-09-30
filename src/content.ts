export const workflow = ['Customer', 'Conversation', 'AI Agent', 'Lead', 'CRM', 'Automation', 'Sale', 'Analytics']

export const channels = ['WhatsApp', 'Websites', 'Social media', 'Email', 'Phone']

export const problems = [
  ['Missed enquiries', 'Messages arrive after hours and never get an answer.'],
  ['Slow responses', 'Interested buyers move on while they wait.'],
  ['Manual lead entry', 'Someone copies details from chats into a spreadsheet.'],
  ['Forgotten follow-ups', 'No one owns the next step, so it does not happen.'],
  ['Repetitive questions', 'Your team answers the same ten questions all day.'],
  ['Disconnected tools', 'Chat, CRM and sheets each hold a piece of the story.'],
  ['No sales visibility', 'You cannot see what is happening until it is too late.'],
]

export const layers = [
  ['Customer', 'Someone reaches out on WhatsApp, your website, email or phone.'],
  ['VEYA Inbox', 'Every channel lands in one place, with full conversation history.'],
  ['VEYA Agent', 'Answers common questions and collects the details you need to qualify.'],
  ['VEYA CRM', 'Creates the lead, links it to the customer and records every step.'],
  ['VEYA Flow', 'Runs follow-ups, assignments and reminders without manual work.'],
  ['Business', 'Your team steps in where a human matters: viewings, quotes, closing.'],
  ['VEYA Analytics', 'Shows response times, pipeline and what is working.'],
]

export const products = [
  ['VEYA Agent', 'Your intelligent first line of communication.', 'Answers, asks the right questions and hands qualified leads to your team.'],
  ['VEYA CRM', 'Every customer. Every lead. One system.', 'Contacts, leads and pipeline stages with a clear next action on each.'],
  ['VEYA Flow', 'Automate the work between every step.', 'Triggers, follow-ups, assignments and notifications you define once.'],
  ['VEYA Inbox', 'One place for every customer conversation.', 'A shared inbox across channels with context from the CRM alongside.'],
  ['VEYA Analytics', 'Turn operations into insight.', 'Response times, conversion and workflow activity, measured from day one.'],
] as const

export const industries = ['Real Estate', 'Logistics', 'Education', 'Healthcare', 'Professional Services', 'Travel & Tourism', 'Retail', 'Distribution']

export const steps = [
  ['Audit', 'Map how enquiries and follow-ups actually move through your business.'],
  ['Design', 'Choose one repetitive process and define what "done well" looks like.'],
  ['Build', 'Configure the agent, CRM fields and workflow around that process.'],
  ['Connect', 'Link WhatsApp, forms, email and the tools you already use.'],
  ['Automate', 'Switch it on with your team in the loop for exceptions.'],
  ['Measure', 'Track response time, leads captured and time saved. Then improve.'],
]

export const tech = [
  ['AI', 'Language models for understanding and replying.'],
  ['APIs', 'REST-first integrations with your existing tools.'],
  ['CRM', 'Structured customers, leads and pipeline.'],
  ['WhatsApp', 'The channel your customers already use.'],
  ['Web apps', 'Dashboards and portals for your team.'],
  ['Databases', 'PostgreSQL with tenant isolation.'],
  ['Automation', 'Queued, retryable, auditable workflows.'],
  ['Analytics', 'Operational metrics you can trust.'],
]

export const productDetails = [
  { name: 'VEYA Agent', tag: 'Your intelligent first line of communication.', body: 'Replies to new enquiries, asks the questions your team would ask, and hands qualified leads over with the details already filled in.', bullets: ['Answers common questions instantly', 'Collects name, need, budget and timing', 'Hands off to a person when it should'], ui: [['Customer', 'Is the 2BR still available?'], ['Agent', 'Yes. What is your budget?'], ['Extracted', 'Budget · KES 90,000']] },
  { name: 'VEYA CRM', tag: 'Every customer. Every lead. One system.', body: 'A clean record of who reached out, what they need and what happens next. No copying from chats into spreadsheets.', bullets: ['Leads created automatically', 'Pipeline stages with a next action', 'Full history on every customer'], ui: [['#1048', 'Amina W. · Qualified'], ['#1047', 'J. Otieno · New'], ['#1046', 'S. Mwangi · Contacted']] },
  { name: 'VEYA Flow', tag: 'Automate the work between every step.', body: 'Define what should happen when something changes. Follow-ups, assignments and reminders run on their own and can be audited.', bullets: ['Triggers, conditions and actions', 'Retries and failure alerts', 'A log of every run'], ui: [['Trigger', 'Lead qualified'], ['Action', 'Assign to Grace'], ['Action', 'Send viewing options']] },
  { name: 'VEYA Inbox', tag: 'One place for every customer conversation.', body: 'WhatsApp, website, email and more in a single shared inbox, with the customer’s CRM record beside every thread.', bullets: ['All channels in one view', 'Agent and human replies together', 'Context from the CRM alongside'], ui: [['WhatsApp', 'Amina W. · 2 min ago'], ['Website', 'J. Otieno · 9 min ago'], ['Email', 'S. Mwangi · 1 h ago']] },
  { name: 'VEYA Analytics', tag: 'Turn operations into insight.', body: 'See how quickly you respond, how many leads you capture and where they stall, so you improve the process with evidence.', bullets: ['Response time and coverage', 'Lead sources and conversion', 'Workflow activity and failures'], ui: [['Response rate', 'Tracked per channel'], ['Pipeline', 'By stage and owner'], ['Automations', 'Runs and outcomes']] },
] as const

export const industryCards = [
  { name: 'Real Estate', img: '/img/zarafa-towers.jpg', pos: 'center 30%', line: 'Qualify enquiries, book viewings, follow up on every lead.' },
  { name: 'Logistics', img: '/img/mombasa-port.jpg', pos: 'center', line: 'Quote requests, shipment questions and hand-offs to operations.' },
  { name: 'Education', img: '/img/university.jpg', pos: 'center', line: 'Admissions enquiries and applicant follow-ups.' },
  { name: 'Healthcare', img: null, pos: 'center', line: 'Appointment requests and routine questions, routed to the right team.' },
  { name: 'Professional Services', img: '/img/nairobi-savannah.jpg', pos: 'center', line: 'Capture enquiries, qualify by service and schedule consultations.' },
  { name: 'Travel & Tourism', img: '/img/amboseli.jpg', pos: 'center 60%', line: 'Trip enquiries, availability questions and booking follow-ups.' },
  { name: 'Retail', img: '/img/retail.jpg', pos: 'center', line: 'Product questions, order enquiries and repeat-customer follow-ups.' },
  { name: 'Distribution', img: '/img/matatu.jpg', pos: 'center', line: 'Reseller enquiries, order requests and delivery follow-ups.' },
] as const

export const offerings = [
  ['AI Automation Audit', 'Find the one process worth automating and get a clear plan.'],
  ['AI Lead Agent', 'A first-response agent that qualifies enquiries.'],
  ['Customer Communication Automation', 'Consistent, fast replies across your channels.'],
  ['Lead Management', 'A CRM set up around how you actually sell.'],
  ['Workflow Automation', 'Follow-ups and hand-offs that run themselves.'],
  ['Custom Business Systems', 'Software built for the way your business works.'],
]

export const principles = [
  ['Start small', 'One process, done well, beats a big rollout nobody uses.'],
  ['Measure it', 'If we cannot measure the improvement, we have not finished.'],
  ['People stay in charge', 'Automation handles the routine. Your team handles what matters.'],
  ['Say what is true', 'No inflated claims. We show what the system does.'],
]

export const roadmap = [
  ['Now', 'Productized services', 'Audits, lead agents and workflow builds delivered as fixed-scope projects.'],
  ['Next', 'Standard products', 'VEYA Agent, CRM, Flow, Inbox and Analytics as repeatable software.'],
  ['Then', 'VEYA OS', 'One operating layer that connects the whole business.'],
]

export const trust = [
  ['Tenant isolation', 'Every organization’s data is separated by design.'],
  ['Role-based access', 'Owners, admins, agents and viewers see what they should.'],
  ['Audit logs', 'Who did what, and when, on every important action.'],
  ['Verified webhooks', 'Incoming messages are authenticated before they are trusted.'],
  ['Secrets stay server-side', 'API keys never reach the browser.'],
  ['Validated input', 'Rate limits and strict validation on every endpoint.'],
]

export const faqs = [
  ['Do I need to replace my current tools?', 'No. VEYA connects to the tools you already use and adds the missing layer between them.'],
  ['What does the Automation Audit include?', 'A review of one process, a written recommendation and a plan for building and measuring it.'],
  ['Which channels do you support?', 'WhatsApp, website forms and email first. Other channels are scoped during the audit.'],
  ['Does this replace my team?', 'No. The agent handles first response and routine steps. People take over conversations that need judgement.'],
  ['Who owns my data?', 'You do. Each organization’s data is kept separate from every other customer’s.'],
  ['How long does a first workflow take?', 'It depends on the process and the tools involved. The audit gives you a specific plan and timeline.'],
]
