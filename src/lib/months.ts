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
export const LOOSE = new Set(['my friend', 'my mate', 'my bestie', 'my colleague', 'my coworker', 'my neighbour', 'my neighbor'])

export const monthKey = (date: string) => date.slice(0, 7)

/** How many evenings each person was named on, counted once per evening. */
export function countPeople(entries: Entry[]): Map<string, number> {
  const people = new Map<string, number>()
  for (const e of entries) {
    const names = new Set<string>()
    const texts = [...e.gratitudes.flatMap((g) => [g.text, g.because]), e.promptAnswer, e.letter?.to ?? '']
    for (const t of texts) {
      for (const p of findPeople(t)) if (!LOOSE.has(p.name)) names.add(p.name)
    }
    for (const n of names) people.set(n, (people.get(n) ?? 0) + 1)
  }
  return people
}

/** The names that came up on at least two evenings, most often first. */
export function topOf(people: Map<string, number>, limit: number): { name: string; count: number }[] {
  return [...people.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

/** Top themes with people's names left out, so "sam" never shows up as a thing. A name that slips through keeps its capital. */
export function topThings(entries: Entry[], people: Map<string, number>, limit: number): Theme[] {
  const personWords = new Set([...people.keys(), ...LOOSE].map((n) => n.replace(/^my /, '').toLowerCase()))
  return topThemes(entries, limit + 5)
    .filter((t) => !personWords.has(t.word))
    .slice(0, limit)
    .map((t) => (t.proper ? { ...t, word: t.word[0].toUpperCase() + t.word.slice(1) } : t))
}

/** A quiet summary of one month's evenings: who and what came up, and the moments kept. */
export function summariseMonth(month: string, entries: Entry[]): MonthSummary {
  const inMonth = entries.filter((e) => monthKey(e.date) === month).sort((a, b) => a.date.localeCompare(b.date))
  const people = countPeople(inMonth)
  return {
    month,
    evenings: inMonth.length,
    people: topOf(people, 3),
    things: topThings(inMonth, people, 3),
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
