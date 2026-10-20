import { findPeople } from './people'
import { topThemes, type Theme } from './stats'
import type { Entry } from './types'

export interface MonthSummary {
  /** YYYY-MM. */
  month: string
  evenings: number
  /** People named most often, counted once per evening. */
  people: { name: string; count: number }[]
  /** Things that came up most, with people's names left out. */
  things: Theme[]
  starred: Entry[]
  letters: number
}

/** Relations that are often a different person each time, so counting them together says little. */
const LOOSE = new Set(['my friend', 'my mate', 'my bestie', 'my colleague', 'my coworker', 'my neighbour', 'my neighbor'])

export const monthKey = (date: string) => date.slice(0, 7)

/** A quiet summary of one month's evenings: who and what came up, and the moments kept. */
export function summariseMonth(month: string, entries: Entry[]): MonthSummary {
  const inMonth = entries.filter((e) => monthKey(e.date) === month).sort((a, b) => a.date.localeCompare(b.date))

  const people = new Map<string, number>()
  for (const e of inMonth) {
    const names = new Set<string>()
    const texts = [...e.gratitudes.flatMap((g) => [g.text, g.because]), e.promptAnswer, e.letter?.to ?? '']
    for (const t of texts) {
      for (const p of findPeople(t)) if (!LOOSE.has(p.name)) names.add(p.name)
    }
    for (const n of names) people.set(n, (people.get(n) ?? 0) + 1)
  }
  const topPeople = [...people.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }))

  const personWords = new Set([...people.keys(), ...LOOSE].map((n) => n.replace(/^my /, '').toLowerCase()))
  const things = topThemes(inMonth, 8)
    .filter((t) => !personWords.has(t.word))
    .slice(0, 3)

  return {
    month,
    evenings: inMonth.length,
    people: topPeople,
    things,
    starred: inMonth.filter((e) => e.starred),
    letters: inMonth.filter((e) => e.letter).length,
  }
}

/** Summaries for every month that has finished, newest first. The current month gets one once it ends. */
export function finishedMonths(entries: Entry[], today: string): MonthSummary[] {
  const current = monthKey(today)
  const months = [...new Set(entries.map((e) => monthKey(e.date)))].filter((m) => m < current).sort().reverse()
  return months.map((m) => summariseMonth(m, entries))
}
