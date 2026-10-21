import { addDays, daysBetween, parseISODate, weekday } from './dates'
import { countPeople, monthKey, topOf, topThings } from './months'
import { LENS_LABELS } from './prompts'
import { isReflectionNight } from './rhythm'
import { REST_WINDOW_DAYS } from './streak'
import { thanksSent, totalGratitudes, type Theme } from './stats'
import type { Entry, Gratitude, Lens, Rhythm } from './types'

/** Gleam Plus stats and the year in review, all worked out on the phone. */

export type Range = 30 | 90 | 'all'

export const RANGES: { value: Range; label: string }[] = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 'all', label: 'All time' },
]

/** Entries from the last `range` days up to today, oldest first. */
export function inRange(entries: Record<string, Entry>, today: string, range: Range): Entry[] {
  return Object.values(entries)
    .filter((e) => e.date <= today && (range === 'all' || daysBetween(e.date, today) < range))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * The longest streak ever, by the same rules as the current one (rest
 * nights pass, one missed night a week is forgiven), so the two always agree.
 * One pass over the days: a missed night within a week of the previous miss
 * ends the run, and the new run starts just after that previous miss.
 */
export function longestRun(entries: Record<string, Entry>, today: string, rhythm: Rhythm): number {
  const dates = Object.keys(entries)
  if (dates.length === 0) return 0
  const earliest = dates.reduce((a, b) => (a < b ? a : b))
  let best = 0
  let run = 0
  let lastMiss: string | null = null
  let sinceLastMiss = 0
  for (let day = earliest; day <= today; day = addDays(day, 1)) {
    if (entries[day]) {
      run++
      sinceLastMiss++
      if (run > best) best = run
    } else if (isReflectionNight(day, rhythm) && day !== today) {
      if (lastMiss !== null && daysBetween(lastMiss, day) < REST_WINDOW_DAYS) run = sinceLastMiss
      lastMiss = day
      sinceLastMiss = 0
    }
  }
  return best
}

/** Monday first, matching the rhythm picker. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export interface WeekdayMood {
  day: number
  name: string
  /** Average mood from 1 to 5, or null with no moods that weekday. */
  average: number | null
  count: number
}

export function moodByWeekday(list: Entry[]): WeekdayMood[] {
  return WEEK_ORDER.map((day) => {
    const moods = list.filter((e) => e.mood !== null && weekday(e.date) === day).map((e) => e.mood!)
    return {
      day,
      name: WEEKDAY_NAMES[day],
      average: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
      count: moods.length,
    }
  })
}

/** Lighter evenings tend to fall on this weekday. Needs a few nights each before it says anything. */
export function brightestWeekday(days: WeekdayMood[], minNights = 3): WeekdayMood | null {
  const eligible = days.filter((d) => d.average !== null && d.count >= minNights)
  if (eligible.length < 2) return null
  const best = eligible.reduce((a, b) => (b.average! > a.average! ? b : a))
  const lowest = eligible.reduce((a, b) => (b.average! < a.average! ? b : a))
  // A difference this small is just noise.
  return best.average! - lowest.average! >= 0.4 ? best : null
}

/** How many nights were each mood, Heavy to Bright. */
export function moodCounts(list: Entry[]): number[] {
  const counts = [0, 0, 0, 0, 0]
  for (const e of list) if (e.mood) counts[e.mood - 1]++
  return counts
}

/** The kinds of question answered most, with text written. */
export function lensCounts(list: Entry[]): { lens: Lens; label: string; count: number }[] {
  const counts = new Map<Lens, number>()
  for (const e of list) if (e.lens && e.promptAnswer.trim()) counts.set(e.lens, (counts.get(e.lens) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([lens, count]) => ({ lens, label: LENS_LABELS[lens], count }))
}

export interface Insights {
  nights: number
  gratitudes: number
  withReasons: number
  thanks: number
  letters: number
  people: { name: string; count: number }[]
  things: Theme[]
  weekdays: WeekdayMood[]
  brightest: WeekdayMood | null
  moods: number[]
  lenses: { lens: Lens; label: string; count: number }[]
}

export function insights(list: Entry[]): Insights {
  const people = countPeople(list)
  const weekdays = moodByWeekday(list)
  return {
    nights: list.length,
    gratitudes: totalGratitudes(list),
    withReasons: list.reduce((n, e) => n + e.gratitudes.filter((g) => g.because.trim()).length, 0),
    thanks: thanksSent(list),
    letters: list.filter((e) => e.letter).length,
    people: topOf(people, 5),
    things: topThings(list, people, 6),
    weekdays,
    brightest: brightestWeekday(weekdays),
    moods: moodCounts(list),
    lenses: lensCounts(list).slice(0, 3),
  }
}

/** The year in review is offered from 1 December to 7 January, for the year just ending. */
export function reviewYearFor(today: string): number | null {
  const d = parseISODate(today)
  if (d.getMonth() === 11) return d.getFullYear()
  if (d.getMonth() === 0 && d.getDate() <= 7) return d.getFullYear() - 1
  return null
}

/** A year needs this many evenings before it's worth a review. */
export const YEAR_MIN_ENTRIES = 10

export interface YearReview {
  year: number
  nights: number
  gratitudes: number
  thanks: number
  letters: number
  people: { name: string; count: number }[]
  things: Theme[]
  /** The month with the most evenings reflected. */
  busiestMonth: { month: string; nights: number } | null
  /** The month with the lightest average mood, with at least four moods. */
  brightestMonth: { month: string; average: number } | null
  /** Moments kept from Sunday look-backs. */
  kept: Entry[]
  /** A few of the most detailed gratitudes, oldest first. */
  favourites: { date: string; gratitude: Gratitude }[]
}

export function yearsWithEntries(entries: Record<string, Entry>): number[] {
  return [...new Set(Object.keys(entries).map((d) => Number(d.slice(0, 4))))].sort((a, b) => b - a)
}

export function yearReview(entries: Record<string, Entry>, year: number): YearReview {
  const list = Object.values(entries)
    .filter((e) => e.date.startsWith(`${year}-`))
    .sort((a, b) => a.date.localeCompare(b.date))
  const people = countPeople(list)

  const byMonth = new Map<string, Entry[]>()
  for (const e of list) byMonth.set(monthKey(e.date), [...(byMonth.get(monthKey(e.date)) ?? []), e])
  let busiestMonth: YearReview['busiestMonth'] = null
  let brightestMonth: YearReview['brightestMonth'] = null
  for (const [month, items] of byMonth) {
    if (!busiestMonth || items.length > busiestMonth.nights) busiestMonth = { month, nights: items.length }
    const moods = items.filter((e) => e.mood !== null).map((e) => e.mood!)
    if (moods.length >= 4) {
      const average = moods.reduce((a, b) => a + b, 0) / moods.length
      if (!brightestMonth || average > brightestMonth.average) brightestMonth = { month, average }
    }
  }

  const favourites = list
    .flatMap((e) => e.gratitudes.map((gratitude) => ({ date: e.date, gratitude, starred: e.starred })))
    .filter((f) => f.gratitude.because.trim() || f.gratitude.text.length >= 30)
    .sort((a, b) => Number(b.starred) - Number(a.starred) || score(b.gratitude) - score(a.gratitude) || a.date.localeCompare(b.date))
    // The same words on two nights only need rereading once.
    .filter((f, i, all) => all.findIndex((o) => same(o.gratitude, f.gratitude)) === i)
    .slice(0, 4)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, gratitude }) => ({ date, gratitude }))

  return {
    year,
    nights: list.length,
    gratitudes: totalGratitudes(list),
    thanks: thanksSent(list),
    letters: list.filter((e) => e.letter).length,
    people: topOf(people, 3),
    things: topThings(list, people, 5),
    busiestMonth,
    brightestMonth,
    kept: list.filter((e) => e.starred).slice(-6),
    favourites,
  }
}

/** Longer gratitudes with a reason are the nicest to reread. */
const score = (g: Gratitude) => g.text.length + g.because.length * 2
const same = (a: Gratitude, b: Gratitude) => a.text.trim().toLowerCase() === b.text.trim().toLowerCase()
