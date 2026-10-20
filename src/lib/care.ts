import { addDays, daysBetween } from './dates'
import { isLetterNight, isLookbackNight } from './flow'
import { moodBranch } from './prompts'
import { DEFAULT_SETTINGS, type Entry, type Mood, type Rhythm } from './types'

/** Heavy nights in the last seven that make the next hard night offer a gentler start. */
export const HEAVY_NIGHTS = 3
/** The care card is never shown more than once in this many days. */
export const CARE_EVERY_DAYS = 7

/** How many of the seven nights before `date` were heavy. */
export function heavyNights(date: string, entries: Record<string, Entry>): number {
  return Array.from({ length: 7 }, (_, i) => entries[addDays(date, -1 - i)]).filter((e) => e?.mood === 1).length
}

/**
 * Whether tonight opens with the gentle card: a low or heavy night after
 * three or more heavy nights in the last week, at most once a week. Tonight
 * itself still counts as shown if it was already offered.
 */
export function needsCare(date: string, entries: Record<string, Entry>, mood: Mood | null, lastShown: string | null): boolean {
  if (moodBranch(mood) === 'normal') return false
  if (lastShown && lastShown !== date && daysBetween(lastShown, date) < CARE_EVERY_DAYS) return false
  return heavyNights(date, entries) >= HEAVY_NIGHTS
}

/** The monthly check needs a few weeks of reflecting first. */
export const HELP_MIN_ENTRIES = 10
export const HELP_EVERY_DAYS = 30

/**
 * Whether tonight's closing screen asks "Is Gleam helping you wind down?":
 * a normal-mood night with at least ten entries, a month since it was last
 * asked, and not on a night that already had a letter or look-back.
 */
export function isHelpCheckNight(
  date: string,
  entries: Record<string, Entry>,
  mood: Mood | null,
  lastAsked: string | null,
  rhythm: Rhythm = DEFAULT_SETTINGS.rhythm,
): boolean {
  if (mood === null || moodBranch(mood) !== 'normal') return false
  if (Object.keys(entries).length < HELP_MIN_ENTRIES) return false
  if (lastAsked === date) return true
  if (lastAsked && daysBetween(lastAsked, date) < HELP_EVERY_DAYS) return false
  const before = Object.fromEntries(Object.entries(entries).filter(([d]) => d < date))
  return !entries[date]?.letterOffered && !isLookbackNight(date, before, mood, rhythm) && !isLetterNight(date, before, mood, rhythm)
}
