import { addDays, daysBetween } from './dates'
import type { Entry, Mood } from './types'

const STOPWORDS = new Set(
  `a about after all also am an and any are as at be because been being but by can could did do does doing
  done for from get got had has have having her here him his how i i'm im if in into is it it's its just like
  made make me more most my myself no not now of off on once one only or other our out over really so some
  still such than that the their them then there these they this those through to today too up us very was
  we well were what when where which while who why will with would you your yours day days thing things
  time grateful thankful lot little bit good great nice felt feel feeling being able`.split(/\s+/),
)

export interface Theme {
  word: string
  count: number
}

/** The words that keep coming up in your gratitudes, most frequent first. */
export function topThemes(entries: Entry[], limit = 5): Theme[] {
  const counts = new Map<string, number>()
  for (const e of entries) {
    // Count each word once per night so one long entry doesn't dominate.
    const seen = new Set<string>()
    for (const g of e.gratitudes) {
      for (const raw of g.toLowerCase().match(/[a-z][a-z']+/g) ?? []) {
        const word = raw.replace(/'s$/, '')
        if (word.length < 3 || STOPWORDS.has(word)) continue
        seen.add(word)
      }
    }
    for (const w of seen) counts.set(w, (counts.get(w) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }))
}

export function totalGratitudes(entries: Entry[]): number {
  return entries.reduce((n, e) => n + e.gratitudes.length, 0)
}

/** Mood for each of the last seven logical days, oldest first. */
export function moodWeek(entries: Record<string, Entry>, today: string): { date: string; mood: Mood | null }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6)
    return { date, mood: entries[date]?.mood ?? null }
  })
}

export interface Resurfaced {
  entry: Entry
  gratitude: string
  label: string
}

/** A past gratitude to show again: one from a week, a month or a year ago if there is one. */
export function resurface(entries: Record<string, Entry>, today: string): Resurfaced | null {
  const anniversaries: [number, string][] = [
    [365, 'A year ago'],
    [30, 'A month ago'],
    [7, 'A week ago'],
  ]
  for (const [days, label] of anniversaries) {
    const e = entries[addDays(today, -days)]
    if (e?.gratitudes.length) return { entry: e, gratitude: pick(e.gratitudes, today), label }
  }
  const older = Object.values(entries).filter((e) => e.gratitudes.length && daysBetween(e.date, today) >= 3)
  if (older.length === 0) return null
  const e = pick(older, today)
  const days = daysBetween(e.date, today)
  return { entry: e, gratitude: pick(e.gratitudes, e.date + today), label: `${days} days ago` }
}

function pick<T>(items: T[], seed: string): T {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return items[h % items.length]
}
