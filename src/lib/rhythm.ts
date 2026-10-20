import { weekday } from './dates'
import type { Rhythm } from './types'

export const WEEKDAYS = [
  { value: 1, short: 'Mon' },
  { value: 2, short: 'Tue' },
  { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' },
  { value: 5, short: 'Fri' },
  { value: 6, short: 'Sat' },
  { value: 0, short: 'Sun' },
]

/** Whether tonight is one the user chose to reflect on. */
export function isReflectionNight(date: string, rhythm: Rhythm): boolean {
  return rhythm.mode === 'nightly' || rhythm.nights.includes(weekday(date))
}

/** Toggles a weekday, always keeping at least one night chosen. */
export function toggleNight(rhythm: Rhythm, day: number): Rhythm {
  const has = rhythm.nights.includes(day)
  if (has && rhythm.nights.length === 1) return rhythm
  const nights = has ? rhythm.nights.filter((d) => d !== day) : [...rhythm.nights, day].sort()
  return { ...rhythm, nights }
}
