import { useEffect, type RefObject } from 'react'
import { createScope } from 'animejs'

export const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Runs anime.js code inside a scope tied to `root`. Selectors inside `setup` only match
 * elements under root, and everything is reverted on unmount (StrictMode safe).
 * `setup` receives `reduced` so callers can skip motion and just show the final state.
 */
export function useAnime(root: RefObject<Element | null>, setup: (reduced: boolean) => void, deps: unknown[] = []) {
  useEffect(() => {
    if (!root.current) return
    const reduced = prefersReduced()
    const scope = createScope({ root: root.current as HTMLElement }).add(() => setup(reduced))
    return () => scope.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
