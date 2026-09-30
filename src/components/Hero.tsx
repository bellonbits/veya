import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { animate, stagger, utils } from 'animejs'
import HeroScene from './HeroScene'
import BeadRing from './BeadRing'
import Nav from './Nav'
import SplitHeading from './SplitHeading'
import { Sparkle } from './Icons'
import { useAnime } from '../lib/anime'

export default function Hero() {
  const root = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const sceneY = useTransform(scrollY, [0, 900], [0, 140])
  const textY = useTransform(scrollY, [0, 700], [0, -50])

  useAnime(root, (reduced) => {
    if (reduced) {
      utils.set('[data-intro]', { opacity: 1 })
      return
    }
    // Entrance
    animate('.mtn', { translateY: [50, 0], opacity: [0, 1], duration: 2400, ease: 'outQuart' })
    animate('[data-intro]', {
      opacity: [0, 1], translateY: [24, 0], delay: stagger(140, { start: 900 }), duration: 900, ease: 'outExpo',
    })
    // Ambient loops (stars, clouds, bead ring) are CSS animations in index.css: compositor-only, no per-frame JS.
  })

  return (
    <header className="bg-lav p-3 sm:p-5 lg:p-6" ref={root}>
      <div className="relative isolate flex min-h-[calc(100svh-1.5rem)] flex-col overflow-hidden rounded-[1.75rem] bg-plum text-white sm:min-h-[calc(100svh-2.5rem)] sm:rounded-[2.25rem] lg:min-h-[max(760px,calc(100svh-3rem))]">
        <motion.div style={{ y: sceneY }} className="absolute -inset-y-[8%] inset-x-0 -z-10 will-change-transform">
          <HeroScene />
        </motion.div>
        <div className="absolute inset-0 -z-0 bg-gradient-to-t from-[#1b1157]/70 via-transparent to-transparent" aria-hidden />

        <Nav />

        <div id="top" className="relative z-10 grid flex-1 gap-10 px-6 pb-8 pt-16 sm:px-10 lg:grid-cols-2 lg:px-16 lg:pb-14 lg:pt-10">
          <div className="order-2 flex items-end lg:order-1">
            <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="w-full max-w-[17rem]">
              <Link
                to="/how-it-works#demo"
                data-intro
                className="relative block overflow-hidden rounded-2xl bg-plum p-5 opacity-0 shadow-2xl shadow-black/30 ring-1 ring-white/10"
              >
                <span className="text-sm font-medium text-white/90">VEYA Agent</span>
                <span className="absolute right-3 top-3 z-10 rounded-full bg-ink/80 px-3 py-1.5 text-[0.7rem] font-medium">Live demo</span>
                <div className="absolute -right-10 -top-6 h-44 w-44 rotate-[18deg]">
                  <BeadRing className="bead-ring h-full w-full will-change-transform" />
                </div>
                <p className="relative mt-24 text-[1.05rem] leading-snug text-white/90">
                  Qualifying property enquiries from WhatsApp into a CRM
                </p>
              </Link>
            </motion.div>
          </div>

          <motion.div style={{ y: textY }} className="order-1 flex flex-col justify-between gap-14 lg:order-2 lg:gap-0 lg:pt-32">
            <p data-intro className="max-w-md text-xl font-medium leading-snug tracking-tight opacity-0 sm:text-2xl">
              VEYA builds intelligent systems that automate customer communication, sales, and business operations.
            </p>
            <div>
              <SplitHeading lines={['Business,', 'automated.']} delay={300} className="display text-[clamp(3.6rem,9.4vw,8.2rem)] text-white" />
              <div className="mt-7 flex flex-wrap items-center gap-2">
                <motion.div data-intro className="opacity-0" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/contact" className="block rounded-xl bg-lime px-6 py-4 text-xs font-bold uppercase tracking-wide text-ink shadow-lg shadow-black/20 transition hover:bg-white">
                    Book an Automation Audit
                  </Link>
                </motion.div>
                <motion.div data-intro className="opacity-0" whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/platform" aria-label="Explore VEYA" className="group flex items-center gap-2 rounded-xl bg-white/20 px-4 py-4 text-xs font-semibold transition hover:bg-white/30">
                    <Sparkle className="h-5 w-5 transition group-hover:rotate-12" />
                    <span className="hidden sm:inline">Explore VEYA</span>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  )
}
