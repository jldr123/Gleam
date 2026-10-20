/**
 * The app's day starts at 04:00, not midnight, so a 00:30 reflection still
 * belongs to the evening before.
 */
export const DAY_START_HOUR = 4

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date: string, n: number): string {
  const d = parseISODate(date)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000)
}

/** The calendar date this moment belongs to, with the day rolling over at 04:00. */
export function logicalDate(now: Date): string {
  const d = new Date(now)
  if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1)
  return toISODate(d)
}

/** Evening runs from 18:00 until the day rolls over at 04:00. */
export function isEvening(now: Date): boolean {
  const h = now.getHours()
  return h >= 18 || h < DAY_START_HOUR
}

export function greeting(now: Date): string {
  const h = now.getHours()
  if (h >= DAY_START_HOUR && h < 12) return 'Good morning'
  if (h >= 12 && h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function formatLongDate(date: string): string {
  return parseISODate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatShortDay(date: string): string {
  return parseISODate(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
}

export function formatMonth(date: string): string {
  return parseISODate(date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

/** 0 is Sunday. */
export function weekday(date: string): number {
  return parseISODate(date).getDay()
}

export function weekdayLetter(date: string): string {
  return parseISODate(date).toLocaleDateString(undefined, { weekday: 'narrow' })
}
