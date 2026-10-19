import { useEffect, useState } from 'react'
import { isEvening } from './lib/dates'
import { useStore } from './store'

/** The app's clock (real time plus any developer offset), refreshed every 30 seconds. */
export function useNow(): Date {
  const offset = useStore((s) => s.clockOffsetMs)
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000)
    const onVisible = () => document.visibilityState === 'visible' && setTick((n) => n + 1)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return new Date(Date.now() + offset)
}

/** Applies the light or evening palette to <html>. */
export function useThemeClass(): void {
  const theme = useStore((s) => s.settings.theme)
  const now = useNow()
  const dark = theme === 'dark' || (theme === 'auto' && isEvening(now))
  useEffect(() => {
    document.documentElement.classList.toggle('evening', dark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1a1410' : '#f7f1e8')
  }, [dark])
}
