import { useLayoutEffect, useRef, type ElementType } from 'react'
import { animate, splitText, stagger } from 'animejs'
import { prefersReduced } from '../lib/anime'

/** Heading whose characters rise in one by one (anime.js). Each entry in `lines` is its own line. */
export default function SplitHeading({
  lines, className = '', as: Tag = 'h1', delay = 0,
}: { lines: string[]; className?: string; as?: ElementType; delay?: number }) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReduced()) return
    const splits = Array.from(el.querySelectorAll<HTMLElement>('[data-line]')).map((n) => splitText(n, { chars: true }))
    const chars = splits.flatMap((s) => s.chars)
    const anim = animate(chars, {
      opacity: [0, 1],
      translateY: ['0.45em', 0],
      rotate: [5, 0],
      delay: stagger(26, { start: delay }),
      duration: 1000,
      ease: 'outExpo',
    })
    return () => {
      anim.revert()
      splits.forEach((s) => s.revert())
    }
  }, [delay])

  return (
    <Tag ref={ref} className={className} aria-label={lines.join(' ')}>
      {lines.map((l) => (
        <span key={l} data-line className="block whitespace-nowrap" aria-hidden>{l}</span>
      ))}
    </Tag>
  )
}
