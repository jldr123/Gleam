import { addDays, daysBetween, formatShortDay } from './dates'
import type { Entry, Gratitude, Mood } from './types'

const STOPWORDS = new Set(
  `a about after all also am an and any are as at be because been being but by can could did do does doing
  done for from get got had has have having her here him his how i i'm im if in into is it it's its just like
  made make me more most my myself no not now of off on once one only or other our out over really so some
  still such than that the their them then there these they this those through to today too up us very was
  we well were what when where which while who why will with would you your yours day days thing things
  time grateful thankful lot little bit good great nice felt feel feeling being able long`.split(/\s+/),
)

/**
 * Common verbs and filler that read oddly as "things that kept coming up"
 * ("call", "clean", "finishing"). Words that are often verbs ("book", "call")
 * go too, since a single word loses the sense.
 */
const NOT_THINGS = new Set(
  `call calls called calling clean cleaned cleaning book booked booking finish finished finishing start started starting
  went go going goes come came coming take took taking taken give gave giving given see saw seeing seen say said saying
  tell told telling ask asked asking help helped helping try tried trying keep kept keeping let put run ran sit sat stay
  stayed think thought know knew want wanted need needed use used find found look looked looking watch watched leave left
  bring brought buy bought pick picked send sent texted reply chatted talk talked talking laugh laughed laughing
  cook cooked cooking eat ate eating drank slept rested worked working walked hugged
  quiet early late old new first last next whole every each much many few lots someone something anything everything
  nothing around back again even ever never always almost actually finally maybe instead without hour hours minutes
  week weeks today's tonight yesterday tomorrow`.split(/\s+/),
)

/** A theme needs to come up on this many evenings before it's worth showing. */
export const THEME_MIN_EVENINGS = 3

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
      for (const raw of g.text.toLowerCase().match(/[a-z][a-z']+/g) ?? []) {
        const word = raw.replace(/'s$/, '')
        if (word.length < 3 || STOPWORDS.has(word) || NOT_THINGS.has(word)) continue
        seen.add(word)
      }
    }
    for (const w of seen) counts.set(w, (counts.get(w) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, c]) => c >= THEME_MIN_EVENINGS)
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

export function thanksSent(entries: Entry[]): number {
  return entries.reduce((n, e) => n + e.thanks.length, 0)
}

/** Resurfacing waits until there is enough history for it to feel like a memory. */
export const RESURFACE_MIN_ENTRIES = 7

export interface Resurfaced {
  entry: Entry
  gratitude: Gratitude
  /** e.g. "A month ago you were grateful for". */
  lead: string
}

const detailed = (g: Gratitude) => g.because.trim().length > 0 || g.text.trim().length >= 30

/**
 * A past gratitude for the home screen: one from exactly a year or a month
 * ago if there is one, otherwise a starred or detailed entry from more than a
 * week ago, picked by date so it stays put all day.
 */
export function resurface(entries: Record<string, Entry>, today: string): Resurfaced | null {
  const all = Object.values(entries)
  if (all.length < RESURFACE_MIN_ENTRIES) return null
  const anniversaries: [number, string][] = [
    [365, 'A year ago you were grateful for'],
    [30, 'A month ago you were grateful for'],
  ]
  for (const [days, lead] of anniversaries) {
    const e = entries[addDays(today, -days)]
    if (e?.gratitudes.length) return { entry: e, gratitude: best(e.gratitudes, today), lead }
  }
  const older = all.filter((e) => e.gratitudes.length && daysBetween(e.date, today) > 7)
  const special = older.filter((e) => e.starred || e.gratitudes.some(detailed))
  const pool = special.length ? special : older
  if (pool.length === 0) return null
  const e = pick(pool, today)
  return { entry: e, gratitude: best(e.gratitudes, today), lead: `On ${formatShortDay(e.date)} you were grateful for` }
}

/** Prefer a gratitude with a reason, since those are the nicest to reread. */
function best(gratitudes: Gratitude[], seed: string): Gratitude {
  const withWhy = gratitudes.filter(detailed)
  return pick(withWhy.length ? withWhy : gratitudes, seed)
}

function pick<T>(items: T[], seed: string): T {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return items[h % items.length]
}
