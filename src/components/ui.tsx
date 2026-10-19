import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Sparkle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2c.6 4.6 1.6 5.6 6.2 6.2-4.6.6-5.6 1.6-6.2 6.2-.6-4.6-1.6-5.6-6.2-6.2C10.4 7.6 11.4 6.6 12 2Z"
        fill="currentColor"
        transform="translate(0 4)"
      />
    </svg>
  )
}

export function Chevron({ dir = 'left', className = '' }: { dir?: 'left' | 'right'; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type Variant = 'primary' | 'quiet' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink shadow-[0_8px_30px_-10px_var(--glow)] active:scale-[0.98]',
  quiet: 'bg-surface-2 text-ink active:scale-[0.98]',
  ghost: 'text-muted active:text-ink',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`rounded-full px-6 py-3.5 text-[15px] font-semibold transition disabled:opacity-40 ${variants[variant]} ${className}`}
    />
  )
}

export function TopBar({ onBack, title, right }: { onBack?: () => void; title?: string; right?: ReactNode }) {
  return (
    <div className="safe-top flex items-center justify-between px-4 pb-2">
      <div className="w-16">
        {onBack && (
          <button onClick={onBack} className="-ml-2 flex h-10 w-10 items-center justify-center text-muted" aria-label="Back">
            <Chevron className="h-6 w-6" />
          </button>
        )}
      </div>
      {title && <div className="text-sm font-semibold tracking-wide text-muted">{title}</div>}
      <div className="flex w-16 justify-end">{right}</div>
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-line bg-surface p-5 ${className}`}>{children}</div>
}
