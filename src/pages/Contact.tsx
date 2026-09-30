import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PageHero from '../components/PageHero'
import { api } from '../lib/api'
import { wrap } from '../sections/Sections'

const field = 'w-full rounded-xl border border-line bg-ink-2 px-4 py-3.5 text-sm outline-none transition focus:border-violet'

export default function Contact() {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    if (f.get('website')) return // honeypot
    const data = Object.fromEntries(f) as Record<string, string>
    const errs: Record<string, string> = {}
    if (!data.name?.trim()) errs.name = 'Please tell us your name.'
    if (!/^\S+@\S+\.\S+$/.test(data.email ?? '')) errs.email = 'Enter a valid email address.'
    if ((data.process ?? '').trim().length < 10) errs.process = 'A sentence or two is enough.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setState('sending')
    try {
      await api('/public/audit-requests', { method: 'POST', body: JSON.stringify(data) })
    } catch {
      // No backend yet: fall back to the user's email client so the request is never lost.
      const body = `Name: ${data.name}\nCompany: ${data.company}\nEmail: ${data.email}\n\nProcess to automate:\n${data.process}`
      window.location.href = `mailto:hello@veya.tech?subject=${encodeURIComponent('Automation Audit request')}&body=${encodeURIComponent(body)}`
    }
    setState('done')
  }

  return (
    <>
      <PageHero
        eyebrow="Contact" lines={['Book an', 'Automation Audit.']}
        body="Tell us about one process that slows your team down. We will tell you if and how to automate it."
        image="/img/nairobi-savannah.jpg" alt="The Nairobi skyline" position="center 40%"
      />
      <main className={`${wrap} py-24`}>
        <div className="mx-auto max-w-xl">
          <AnimatePresence mode="wait">
            {state === 'done' ? (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-lime/40 bg-lime/10 p-8 text-center">
                <h2 className="h2 text-3xl">Thank you.</h2>
                <p className="mt-3 text-mist">We will reply within two business days.</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={onSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                {[['name', 'Your name', 'text'], ['email', 'Work email', 'email'], ['company', 'Company', 'text']].map(([n, l, t]) => (
                  <div key={n}>
                    <label htmlFor={n} className="mb-2 block text-sm font-medium">{l}</label>
                    <input id={n} name={n} type={t} autoComplete={n === 'name' ? 'name' : n === 'email' ? 'email' : 'organization'} className={field} aria-invalid={!!errors[n]} />
                    {errors[n] && <p className="mt-1.5 text-xs text-[#ff8a8a]">{errors[n]}</p>}
                  </div>
                ))}
                <div>
                  <label htmlFor="process" className="mb-2 block text-sm font-medium">Which process slows you down?</label>
                  <textarea id="process" name="process" rows={4} className={field} aria-invalid={!!errors.process} placeholder="For example: we answer the same WhatsApp questions all day." />
                  {errors.process && <p className="mt-1.5 text-xs text-[#ff8a8a]">{errors.process}</p>}
                </div>
                <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} disabled={state === 'sending'} className="w-full rounded-xl bg-lime px-6 py-4 text-xs font-bold uppercase tracking-wide text-ink disabled:opacity-60">
                  {state === 'sending' ? 'Sending…' : 'Book an Automation Audit'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  )
}
