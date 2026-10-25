import { motion } from 'framer-motion'
import { useState } from 'react'
import { RestoreButton, usePlusProduct } from '../components/plus'
import { Button, Card, Sparkle, TopBar } from '../components/ui'
import { lookName, PLUS_FEATURES } from '../lib/plus'
import { isPrototypePurchase, purchasePlus } from '../lib/purchase'
import { useStore } from '../store'
import { useUI, type LookPreview } from '../ui'
import { unlockPlus } from '../unlock'

export function Plus() {
  const plus = useStore((s) => s.plus)
  const pendingLook = useUI((s) => s.pendingLook)
  const go = useUI((s) => s.go)
  const back = useUI((s) => s.back)
  const product = usePlusProduct()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The look that came with the unlock, to say it's theirs now.
  const [kept, setKept] = useState<LookPreview | null>(null)

  const buy = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await purchasePlus()
      if (result.ok) setKept(unlockPlus())
      else setError(result.message)
    } catch {
      setError("Couldn't reach the App Store. Try again in a moment.")
    }
    setBusy(false)
  }

  return (
    <div className="glow flex min-h-full flex-col">
      <TopBar onBack={back} title="Gleam Plus" />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="safe-bottom flex flex-col gap-4 px-5 pt-4">
        <div className="px-2 text-center">
          <Sparkle className="mx-auto h-9 w-9 text-accent" />
          <h1 className="mt-4 font-serif text-[30px] leading-tight font-light">{plus ? 'Thank you for supporting Gleam' : 'A little more to notice'}</h1>
          <p className="mx-auto mt-3 max-w-[19rem] text-[15px] leading-relaxed text-muted">
            {plus
              ? 'Everything below is unlocked. Your nightly reflection always stays free.'
              : 'Your nightly reflection is free, always. Plus adds a few extras for anyone who wants to look a little deeper.'}
          </p>
        </div>

        <Card>
          <ul className="flex flex-col gap-4">
            {PLUS_FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <Sparkle className="mt-1 h-4 w-4 shrink-0 text-accent" />
                <div>
                  <div className="text-[15px] font-semibold">{f.title}</div>
                  <div className="mt-0.5 text-sm leading-relaxed text-muted">{f.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {plus ? (
          <div className="flex flex-col gap-2">
            {kept && (
              <p className="pb-2 text-center font-serif text-[18px]">
                {lookName(kept)} {kept.palette && kept.font ? 'are' : 'is'} now yours.
              </p>
            )}
            <Button onClick={() => go('stats')}>See your stats</Button>
            <Button variant="quiet" onClick={() => go('year')}>
              Your year in Gleam
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            {pendingLook && (
              <p className="pb-1 text-sm text-muted">
                You're previewing {lookName(pendingLook)}. Unlock to keep {pendingLook.palette && pendingLook.font ? 'them' : 'it'}.
              </p>
            )}
            <Button className="w-full" onClick={buy} disabled={busy}>
              Unlock for {product.price}
            </Button>
            <div className="text-xs text-faint">{product.terms}</div>
            {error && (
              <p role="alert" className="text-sm text-muted">
                {error}
              </p>
            )}
            <RestoreButton className="mt-1" onRestored={setKept} />
            {isPrototypePurchase() && (
              <p className="mt-2 max-w-[19rem] text-xs leading-relaxed text-faint">
                In this prototype, unlocking is free so you can try it. The App Store version will take payment through Apple.
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}
