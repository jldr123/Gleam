import { addDays, DAY_START_HOUR, toISODate, weekday } from './dates'
import type { Rhythm } from './types'

/** The reflection-time window opens this long before the chosen time and lasts until the day rolls over. */
export const WINDOW_BEFORE_MINUTES = 30

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** Minutes since the day rolled over at 04:00, so 1am sits after 11pm. */
const sinceRollover = (minutes: number) => (minutes - DAY_START_HOUR * 60 + 1440) % 1440

/** Whether it's within half an hour of their reflection time, or later that evening. */
export function isReflectionTime(now: Date, time: string): boolean {
  const start = sinceRollover(toMinutes(time) - WINDOW_BEFORE_MINUTES)
  return sinceRollover(now.getHours() * 60 + now.getMinutes()) >= start
}

/** "21:30" → "9:30pm". */
export function formatTime(time: string): string {
  const m = toMinutes(time)
  const h = Math.floor(m / 60)
  const mins = String(m % 60).padStart(2, '0')
  return `${h % 12 || 12}:${mins}${h < 12 ? 'am' : 'pm'}`
}

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
const escapeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/**
 * A calendar file with a repeating evening event at their time, on their
 * nights, linking back to Gleam. It uses floating local time, so it stays at
 * 9:30pm wherever they are. The most dependable reminder on iPhone without a server.
 */
export function reminderIcs(time: string, rhythm: Rhythm, url: string, now = new Date()): string {
  const [h, m] = time.split(':').map((n) => n.padStart(2, '0'))
  // Start on the first chosen night from today.
  let date = toISODate(now)
  if (rhythm.mode === 'some') while (!rhythm.nights.includes(weekday(date))) date = addDays(date, 1)
  const rule = rhythm.mode === 'some' ? `FREQ=WEEKLY;BYDAY=${[...rhythm.nights].sort().map((d) => DAY_CODES[d]).join(',')}` : 'FREQ=DAILY'
  const title = 'A few quiet minutes with Gleam'
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gleam//Evening reflection//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:evening-reflection@gleam.app',
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${date.replace(/-/g, '')}T${h}${m}00`,
    'DURATION:PT5M',
    `RRULE:${rule}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(`A minute for what went right today? Open Gleam: ${url}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(title)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

/** True when Gleam runs from the home screen rather than a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return !!nav.standalone || !!window.matchMedia?.('(display-mode: standalone)').matches
}
