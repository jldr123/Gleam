import { useEffect, useState } from 'react'
import { isEvening } from './lib/dates'
import { activeLook, FONTS, paletteDef } from './lib/plus'
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

/** Applies the light or evening palette to <html>, plus any Gleam Plus palette and heading font. */
export function useThemeClass(): void {
  const settings = useStore((s) => s.settings)
  const plus = useStore((s) => s.plus)
  const now = useNow()
  const theme = settings.theme
  const dark = theme === 'dark' || (theme === 'auto' && isEvening(now))
  const { palette, font } = activeLook(settings, plus)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('evening', dark)
    const tokens = paletteDef(palette)[dark ? 'evening' : 'day']
    // Ember is the stylesheet's own look, so clearing the overrides falls back to it.
    for (const [name, value] of Object.entries(tokens)) {
      if (palette === 'ember') root.style.removeProperty(`--${name}`)
      else root.style.setProperty(`--${name}`, value)
    }
    if (font === 'fraunces') root.style.removeProperty('--serif')
    else root.style.setProperty('--serif', FONTS.find((f) => f.id === font)!.stack)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens.bg)
  }, [dark, palette, font])
}
