import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Nav from './Nav'
import SplitHeading from './SplitHeading'
import { ParallaxImage } from '../lib/reveal'

/** Framed photo hero used on every inner page. */
export default function PageHero({
  eyebrow, lines, body, image, alt, position, children,
}: { eyebrow: string; lines: string[]; body: string; image: string; alt: string; position?: string; children?: ReactNode }) {
  return (
    <header className="bg-lav p-3 sm:p-5 lg:p-6">
      <div className="relative isolate flex min-h-[34rem] flex-col overflow-hidden rounded-[1.75rem] bg-plum text-white sm:rounded-[2.25rem] lg:min-h-[max(34rem,68svh)]">
        <ParallaxImage src={image} alt={alt} position={position} eager strength={60} className="absolute inset-0 -z-10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#150d4a] via-[#261c69]/70 to-[#261c69]/35" aria-hidden />
        <Nav />
        <div className="mt-auto px-6 pb-10 pt-24 sm:px-10 lg:px-16 lg:pb-14">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="eyebrow !text-white/70">{eyebrow}</motion.p>
          <SplitHeading lines={lines} className="display mt-4 max-w-4xl text-[clamp(2.8rem,7vw,6rem)]" delay={150} />
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }} className="mt-6 max-w-xl text-lg leading-snug text-white/85">
            {body}
          </motion.p>
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </header>
  )
}
