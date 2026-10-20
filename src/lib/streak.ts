import { addDays } from './dates'
import { isReflectionNight } from './rhythm'
import { DEFAULT_SETTINGS, type Entry, type Rhythm } from './types'

/** One missed night in any seven days is forgiven, so the streak never punishes a single off evening. */
export const REST_WINDOW_DAYS = 7

export interface Streak {
  /** Chosen nights reflected in the current run. */
  nights: number
  /** True when a rest night inside the last week is keeping the run alive. */
  restUsed: boolean
}

/**
 * Walks back from today over the nights the user chose to reflect on; other
 * nights never break the run, and count when they reflected anyway. Today only counts once it's done,
 * so an evening not yet reflected never breaks the streak. A missed night is
 * forgiven if no other chosen night was missed in the previous seven days.
 */
export function computeStreak(entries: Record<string, Entry>, today: string, rhythm: Rhythm = DEFAULT_SETTINGS.rhythm): Streak {
  const dates = Object.keys(entries)
  if (dates.length === 0) return { nights: 0, restUsed: false }
  const earliest = dates.reduce((a, b) => (a < b ? a : b))

  let nights = 0
  let lastMissAt: number | null = null
  let restUsed = false

  for (let i = 0, day = today; day >= earliest; i++, day = addDays(day, -1)) {
    if (entries[day]) {
      nights++
      continue
    }
    // A rest night neither breaks the run nor counts, unless they reflected anyway (above).
    if (!isReflectionNight(day, rhythm)) continue
    if (day === today) continue // tonight isn't over yet
    // Two misses within a week of each other end the run.
    if (lastMissAt !== null && i - lastMissAt < REST_WINDOW_DAYS) break
    lastMissAt = i
    if (i < REST_WINDOW_DAYS + 1) restUsed = true
  }
  if (nights === 0) restUsed = false
  return { nights, restUsed }
}
