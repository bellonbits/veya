import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Wordmark } from './Logo'
import { Arrow, Grid } from './Icons'

export const pages = [
  ['Platform', '/platform'],
  ['Solutions', '/solutions'],
  ['How it works', '/how-it-works'],
  ['About', '/about'],
  ['Contact', '/contact'],
] as const

/** Sits on top of a hero. Menu pill opens an animated page list. */
export default function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const menuBtn = (cls: string) => (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      aria-controls="menu-panel"
      className={`flex items-center gap-2 rounded-xl bg-violet-soft/90 px-4 py-2.5 text-xs font-semibold text-plum shadow-lg shadow-black/10 transition hover:bg-white ${cls}`}
    >
      <Grid /> Menu
    </motion.button>
  )

  return (
    <nav className="relative z-30 flex items-center justify-between px-6 pt-6 sm:px-10 lg:px-16 lg:pt-10" aria-label="Primary">
      <Link to="/" aria-label="VEYA home"><Wordmark /></Link>

      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
        {menuBtn('')}
        <Link to="/solutions" className="rounded-xl px-4 py-2.5 text-xs font-semibold text-white/90 transition hover:text-white">Solutions</Link>
      </div>

      <div className="flex items-center gap-2">
        {menuBtn('md:hidden')}
        <Link to="/app/overview" className="rounded-xl bg-white px-4 py-3 text-xs font-bold text-ink transition hover:bg-lime">Open VEYA</Link>
        <Link to="/contact" className="group flex items-center gap-3 rounded-xl border border-lime/80 py-1 pl-4 pr-1 text-xs font-semibold transition hover:bg-white/10">
          <span className="hidden sm:inline">Get in Touch</span>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-lime text-ink transition group-hover:rotate-45">
            <Arrow className="h-4 w-4 -rotate-45" />
          </span>
        </Link>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-panel"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="absolute left-6 right-6 top-full mt-3 origin-top rounded-2xl border border-white/15 bg-[#1a1250]/90 p-3 shadow-2xl backdrop-blur-xl sm:left-10 sm:right-auto sm:w-72 md:left-1/2 md:-translate-x-1/2"
          >
            <ul>
              {pages.map(([label, to], i) => (
                <motion.li key={to} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <Link to={to} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/10">
                    {label}<Arrow />
                  </Link>
                </motion.li>
              ))}
              <li className="mt-1 border-t border-white/10 pt-2">
                <p className="px-4 pb-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/50">Open the products</p>
                {([['VEYA Agent', '/app/agent'], ['VEYA Inbox', '/app/inbox'], ['VEYA CRM', '/app/crm/leads'], ['VEYA Flow', '/app/flows'], ['VEYA Analytics', '/app/analytics']] as const).map(([l, to]) => (
                  <Link key={to} to={to} className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-lime transition hover:bg-white/10">{l}<Arrow /></Link>
                ))}
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
