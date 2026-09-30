import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion'
import { Wordmark } from './Logo'
import { pages } from './Nav'
import { Arrow } from './Icons'

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return <motion.div style={{ scaleX }} className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-lime" aria-hidden />
}

/** Compact bar that slides in once the hero has scrolled away. */
function StickyBar() {
  const { scrollY } = useScroll()
  const [show, setShow] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setShow(y > 700))
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed left-1/2 top-3 z-40 flex -translate-x-1/2 items-center gap-5 rounded-2xl border border-line bg-ink/80 py-2 pl-5 pr-2 shadow-2xl backdrop-blur-xl"
        >
          <Link to="/" aria-label="VEYA home"><Wordmark className="scale-90" /></Link>
          <Link to="/app/overview" className="whitespace-nowrap rounded-xl bg-white/10 px-4 py-2.5 text-[0.7rem] font-bold uppercase tracking-wide text-white transition hover:bg-white/20">Open VEYA</Link>
          <Link to="/contact" className="whitespace-nowrap rounded-xl bg-lime px-4 py-2.5 text-[0.7rem] font-bold uppercase tracking-wide text-ink transition hover:bg-white">
            <span className="sm:hidden">Book an Audit</span>
            <span className="hidden sm:inline">Book an Automation Audit</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[1240px] px-6 pb-10 pt-6 sm:px-10">
      <div className="grid gap-10 border-t border-line pt-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist">Intelligent systems for modern business. Built in Nairobi for Africa and beyond.</p>
        </div>
        <div>
          <p className="eyebrow">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            {pages.map(([l, to]) => <li key={to}><Link to={to} className="text-white/80 transition hover:text-lime">{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Get started</p>
          <Link to="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-lime">Book an Automation Audit <Arrow /></Link>
          <p className="mt-4 text-sm text-mist">hello@veya.tech</p>
        </div>
      </div>
      <div className="mt-10 flex flex-col justify-between gap-2 text-xs text-mist sm:flex-row">
        <p>© {new Date().getFullYear()} VEYA Technologies. Nairobi, Kenya.</p>
        <p><Link to="/credits" className="hover:text-white">Photo credits</Link></p>
      </div>
    </footer>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <MotionConfig reducedMotion="user">
      <ScrollProgress />
      <StickyBar />
      <motion.div key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
        <Outlet />
      </motion.div>
      <Footer />
    </MotionConfig>
  )
}
