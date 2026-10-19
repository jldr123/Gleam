import { addDays } from './dates'
import type { Entry } from './types'

/** One missed night in any seven is forgiven, so the streak never punishes a single off evening. */
export const REST_WINDOW_DAYS = 7

export interface Streak {
  /** Nights reflected in the current run. */
  nights: number
  /** True when a rest night inside the last week is keeping the run alive. */
  restUsed: boolean
}

/**
 * Walks back from today. Today only counts once it's done, so an evening not
 * yet reflected never breaks the streak. A missed night is forgiven if no
 * other night was missed in the previous seven days of the run.
 */
export function computeStreak(entries: Record<string, Entry>, today: string): Streak {
  const dates = Object.keys(entries)
  if (dates.length === 0) return { nights: 0, restUsed: false }
  const earliest = dates.reduce((a, b) => (a < b ? a : b))

  let day = entries[today] ? today : addDays(today, -1)
  let nights = 0
  let lastMissAt: number | null = null
  let restUsed = false

  for (let i = 0; day >= earliest; i++, day = addDays(day, -1)) {
    if (entries[day]) {
      nights++
      continue
    }
    // Two misses within a week of each other end the run.
    if (lastMissAt !== null && i - lastMissAt < REST_WINDOW_DAYS) break
    lastMissAt = i
    if (i < REST_WINDOW_DAYS) restUsed = true
  }
  if (nights === 0) restUsed = false
  return { nights, restUsed }
}
