import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cx } from '../../lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type Size = 'sm' | 'md' | 'lg'
const V: Record<Variant, string> = {
  primary: 'bg-fg text-canvas hover:opacity-90',
  accent: 'bg-accent text-white hover:brightness-110',
  secondary: 'border border-edge2 bg-panel text-fg hover:bg-sunk',
  ghost: 'text-fg2 hover:bg-sunk hover:text-fg',
  danger: 'bg-bad text-white hover:brightness-110',
}
const S: Record<Size, string> = { sm: 'h-8 gap-1.5 px-2.5 text-[13px]', md: 'h-9 gap-2 px-3.5 text-sm', lg: 'h-11 gap-2 px-5 text-sm' }
const base = 'inline-flex shrink-0 items-center justify-center rounded-lg font-semibold whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-45'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: Size; loading?: boolean; icon?: ReactNode }
export const Button = forwardRef<HTMLButtonElement, Props>(({ variant = 'secondary', size = 'md', loading, icon, className, children, disabled, ...p }, ref) => (
  <button ref={ref} type="button" disabled={disabled || loading} aria-busy={loading || undefined} className={cx(base, V[variant], S[size], className)} {...p}>
    {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
    {children}
  </button>
))

export function LinkButton({ variant = 'secondary', size = 'md', icon, className, children, ...p }: LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return <Link className={cx(base, V[variant], S[size], className)} {...p}>{icon}{children}</Link>
}

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: 'sm' | 'md' }>(
  ({ label, size = 'md', className, children, ...p }, ref) => (
    <button ref={ref} type="button" aria-label={label} title={label} className={cx('inline-flex shrink-0 items-center justify-center rounded-lg text-fg2 transition hover:bg-sunk hover:text-fg disabled:opacity-40', size === 'sm' ? 'h-8 w-8' : 'h-9 w-9', className)} {...p}>{children}</button>
  ),
)
