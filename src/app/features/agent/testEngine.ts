import type { Agent, KnowledgeItem } from '../../types'
import { extractLeadInfo } from '../inbox/assist'

export interface TurnResult { reply: string; intent: string; matched?: string; fields: Record<string, string>; action?: string; match: 'strong' | 'weak' | 'none' }
const QUESTION: Record<string, string> = {
  Name: 'May I have your name?', Phone: 'What is the best phone number to reach you?', Email: 'What email address should we use?', Location: 'Which area are you interested in?',
  Budget: 'What is your approximate monthly budget?', 'Product interest': 'What are you looking for — for example a 2-bedroom apartment, an office or land?', Urgency: 'When would you like to move or start?',
}

/**
 * Local rule engine used by the Test sandbox. It applies the agent's real configuration (qualification fields, escalation triggers,
 * knowledge sources) so you can rehearse behaviour before going live. It is not an LLM and makes no accuracy claims.
 */
export function runTurn(agent: Agent, knowledge: KnowledgeItem[], history: string[], input: string): TurnResult {
  const all = [...history, input]
  const fields = extractLeadInfo(all.map((t, i) => ({ id: String(i), orgId: '', conversationId: '', author: 'customer' as const, text: t, at: 0 })))
  const text = input.toLowerCase()
  const ready = knowledge.filter((k) => k.status === 'ready')
  const find = (re: RegExp) => ready.find((k) => re.test(k.title.toLowerCase()))
  if (/human|person|agent|manager|speak to|talk to someone|complain/.test(text) && agent.escalation.triggers.some((t) => /human|complaint/i.test(t)))
    return { reply: 'Of course. I am handing this conversation to a member of our team, and they will reply here shortly.', intent: 'Request for a human', fields, action: 'Escalate to human · notify via ' + agent.escalation.notifyChannel, match: 'strong' }
  if (/price|cost|how much|rent|fee|rate/.test(text)) {
    const k = find(/pric|rent|fee|rate/)
    return k ? { reply: `Pricing depends on the area and unit. Our "${k.title}" guide has current ranges. ${fields.Budget ? `With a budget of ${fields.Budget}, I can shortlist options.` : QUESTION.Budget}`, intent: 'Pricing question', matched: k.title, fields, match: 'strong' }
      : { reply: "I don't have pricing information yet, so I will pass this to the team to avoid giving you a wrong figure.", intent: 'Pricing question', fields, action: 'Escalate: no knowledge source matched', match: 'none' }
  }
  const missing = agent.qualification.filter((q) => q.enabled && q.required && !fields[q.field] && !(q.field === 'Name' || q.field === 'Phone' || q.field === 'Email'))
  if (missing.length) return { reply: QUESTION[missing[0].field] ?? `Could you tell me your ${missing[0].field.toLowerCase()}?`, intent: /looking|need|want|interested/.test(text) ? 'Product enquiry' : 'Qualification', fields, match: Object.keys(fields).length ? 'strong' : 'weak' }
  return { reply: "Thank you, I have what I need. I've noted your requirements and a sales representative will be in touch shortly.", intent: 'Ready to buy', fields, action: `Create lead${agent.workflowIds.length ? ' · trigger workflow' : ''}`, match: 'strong' }
}
