import { useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_PRODUCT, getProduct, restorePlus, type PlusProduct } from '../lib/purchase'
import { useStore } from '../store'
import { useUI } from '../ui'
import { Button, Sparkle } from './ui'

/** A small "Plus" tag beside things that need Gleam Plus. */
export function PlusBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-accent ${className}`}>
      <Sparkle className="h-3 w-3" />
      Plus
    </span>
  )
}

/**
 * Shows the user's own content softly blurred with a gentle note on top,
 * so a free user sees what Plus would show them rather than a hard wall.
 */
export function PlusGate({ children, title, text }: { children: ReactNode; title: string; text: string }) {
  const plus = useStore((s) => s.plus)
  const go = useUI((s) => s.go)
  if (plus) return <>{children}</>
  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none max-h-[34rem] overflow-hidden opacity-60 blur-[6px] select-none">
        {children}
      </div>
      <div className="absolute inset-x-0 top-10 flex justify-center px-2">
        <div className="w-full max-w-[20rem] rounded-3xl border border-line bg-surface p-5 text-center shadow-[0_20px_60px_-20px_rgb(0_0_0/0.35)]">
          <PlusBadge />
          <div className="mt-3 font-serif text-[21px] leading-snug">{title}</div>
          <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
          <Button className="mt-4 w-full" onClick={() => go('plus')}>
            See Gleam Plus
          </Button>
        </div>
      </div>
    </div>
  )
}

/** The store's price and terms, starting from the default until the store answers. */
export function usePlusProduct(): PlusProduct {
  const [product, setProduct] = useState(DEFAULT_PRODUCT)
  useEffect(() => {
    let live = true
    getProduct().then((p) => live && setProduct(p)).catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return product
}

/** "Restore purchase", for a new phone or a reinstall. Says what happened in place. */
export function RestoreButton({ className = '' }: { className?: string }) {
  const setPlus = useStore((s) => s.setPlus)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const restore = async () => {
    setBusy(true)
    try {
      const result = await restorePlus()
      if (result.restored) setPlus(true)
      setMessage(result.message)
    } catch {
      setMessage("Couldn't reach the App Store. Try again in a moment.")
    }
    setBusy(false)
  }
  return (
    <div className={`text-center ${className}`}>
      <button onClick={restore} disabled={busy} className="px-3 py-2 text-sm text-muted underline-offset-4 active:text-ink disabled:opacity-50">
        Restore purchase
      </button>
      {message && (
        <p role="status" className="text-xs text-faint">
          {message}
        </p>
      )}
    </div>
  )
}
