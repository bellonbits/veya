import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

const ease = [0.2, 0.7, 0.2, 1] as const

/** Fade + rise when scrolled into view. `delay` is in ms to match the older API. */
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.7, delay: delay / 1000, ease }}
    >
      {children}
    </motion.div>
  )
}

/** Photo that drifts slightly slower than the page. Fills its parent; parent must size it. */
export function ParallaxImage({
  src, alt, className = '', position = 'center', strength = 50, eager = false,
}: { src: string; alt: string; className?: string; position?: string; strength?: number; eager?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength])
  return (
    <div ref={ref} className={`${className.includes('absolute') ? '' : 'relative'} overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ y, scale: 1.18, objectPosition: position }}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  )
}
