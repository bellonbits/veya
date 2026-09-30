import type { Lead, Message } from '../../types'
import { kes } from '../../lib/format'

/**
 * AI assist for the composer. These run locally on the conversation text so the UI is fully functional today;
 * the same signatures will call the VEYA Agent API (POST /api/v1/agents/{id}/assist) once it exists.
 */
export function extractLeadInfo(messages: Message[]): Record<string, string> {
  const text = messages.filter((m) => m.author === 'customer').map((m) => m.text).join(' \n ')
  const out: Record<string, string> = {}
  const budget = text.match(/(?:kes|ksh)?\s*(\d{1,3}(?:[,\s]\d{3})+|\d{4,})/i)
  if (budget) out.Budget = `KES ${Number(budget[1].replace(/[,\s]/g, '')).toLocaleString('en-KE')}`
  const beds = text.match(/(\d)\s*[- ]?\s*(?:bed|bedroom|br)/i)
  if (beds) out.Bedrooms = beds[1]
  if (/\bunfurnished\b/i.test(text)) out.Furnishing = 'Unfurnished'
  else if (/\bfurnished\b/i.test(text)) out.Furnishing = 'Furnished'
  const area = text.match(/\b(Kilimani|Westlands|Lavington|Karen|Runda|Ruaka|Kitengela|Syokimau|Nyali)\b/i)
  if (area) out.Location = area[1][0].toUpperCase() + area[1].slice(1).toLowerCase()
  if (/asap|urgent|this month|immediately|soon/i.test(text)) out.Urgency = 'This month'
  return out
}

export function summarize(messages: Message[], lead?: Lead): string {
  const customer = messages.filter((m) => m.author === 'customer')
  if (!customer.length) return 'No customer messages yet.'
  const info = extractLeadInfo(messages)
  const facts = Object.entries(info).map(([k, v]) => `${k.toLowerCase()}: ${v}`).join(', ')
  const last = customer.at(-1)!.text
  return `${customer.length} customer message${customer.length > 1 ? 's' : ''}, ${messages.length} in total. ${facts ? `Captured ${facts}. ` : ''}${lead ? `Linked to Lead #${lead.number} (${lead.status}, ${kes(lead.value)}). ` : 'No lead yet. '}Latest from customer: “${last.length > 90 ? last.slice(0, 90) + '…' : last}”`
}

export function draftReply(messages: Message[], name: string, agentName: string): string {
  const first = name.split(' ')[0]
  const last = [...messages].reverse().find((m) => m.author === 'customer')?.text.toLowerCase() ?? ''
  const info = extractLeadInfo(messages)
  if (/viewing|saturday|sunday|tomorrow|\d\s?(am|pm)/.test(last)) return `Hi ${first}, that time works. I'll confirm the viewing and send you the exact location and my contact shortly.`
  if (/price|cost|fee|rent|how much/.test(last)) return `Hi ${first}, pricing depends on the exact unit and area. ${info.Budget ? `Within ${info.Budget}, ` : ''}I can share a shortlist with prices today. Would that help?`
  if (/parking|title|deed|lease/.test(last)) return `Hi ${first}, good question. I'll confirm the details with the team and come back to you within the hour.`
  if (!info.Budget) return `Hi ${first}, thanks for reaching out. What budget range are you working with?`
  return `Hi ${first}, thanks for the details. I'm preparing options that match and will send them over shortly. — ${agentName}`
}

const SW: [RegExp, string][] = [
  [/^hi (\w+),?/i, 'Habari $1,'], [/thanks for reaching out/i, 'asante kwa kuwasiliana nasi'], [/what budget range are you working with\??/i, 'bajeti yako ni kiasi gani?'],
  [/that time works/i, 'muda huo unafaa'], [/i'll confirm the viewing/i, 'nitathibitisha kutazama nyumba'], [/would that help\??/i, 'je, hilo litakusaidia?'], [/thank you/i, 'asante sana'],
]
export function translateSw(text: string): string | null {
  let hit = false
  const out = SW.reduce((t, [re, to]) => (re.test(t) ? ((hit = true), t.replace(re, to)) : t), text)
  return hit ? out : null
}

export const TEMPLATES = [
  { label: 'Greeting', text: 'Hello! Thanks for contacting us. How can we help you today?' },
  { label: 'Request budget', text: 'Could you share your approximate budget so I can send suitable options?' },
  { label: 'Offer viewing', text: 'Would you like to schedule a viewing? I have slots available this week.' },
  { label: 'Follow-up', text: 'Just following up on our conversation. Are you still interested?' },
  { label: 'Closing', text: 'Thank you for your time. Please reach out any time if you need anything else.' },
]
