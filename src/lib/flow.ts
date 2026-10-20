import { addDays, weekday } from './dates'
import { findPerson } from './people'
import { moodBranch, type Branch } from './prompts'
import type { Draft, Entry, Mood, Step } from './types'

export const SUPPORT_URL = 'https://findahelpline.com'

/** How many gratitude slots a night offers. Very low nights skip the ask entirely. */
export function maxGratitudes(branch: Branch): number {
  return branch === 'normal' ? 3 : branch === 'low' ? 1 : 0
}

/** The previous six nights' entries, oldest first. */
export function weekEntries(date: string, entries: Record<string, Entry>): Entry[] {
  return Array.from({ length: 6 }, (_, i) => entries[addDays(date, i - 6)]).filter((e): e is Entry => !!e)
}

/** Sundays with at least two other nights this week swap the lens for a look-back. */
export function isLookbackNight(date: string, entries: Record<string, Entry>, mood: Mood | null): boolean {
  return weekday(date) === 0 && moodBranch(mood) !== 'veryLow' && weekEntries(date, entries).length >= 2
}

/** The steps for tonight, in order. Recomputed as the draft changes, since mood and names reshape the flow. */
export function stepsFor(draft: Pick<Draft, 'date' | 'mood' | 'gratitudes' | 'promptAnswer'>, entries: Record<string, Entry>): Step[] {
  const branch = moodBranch(draft.mood)
  const steps: Step[] = ['mood']
  if (draft.mood === null) return steps
  if (maxGratitudes(branch) > 0) steps.push('gratitude')
  steps.push(isLookbackNight(draft.date, entries, draft.mood) ? 'lookback' : 'prompt')
  if (personFromDraft(draft)) steps.push('thanks')
  steps.push('note')
  return steps
}

export function personFromDraft(draft: Pick<Draft, 'gratitudes' | 'promptAnswer'>) {
  for (const g of draft.gratitudes) {
    const p = findPerson(`${g.text} ${g.because}`)
    if (p) return { ...p, about: g }
  }
  const p = findPerson(draft.promptAnswer)
  return p ? { ...p, about: null } : null
}

const GENERIC = new Set([
  'family', 'health', 'friends', 'friend', 'food', 'home', 'life', 'work', 'job', 'money', 'love', 'everything',
  'nothing', 'sleep', 'weather', 'my family', 'my health', 'my friends', 'my job', 'my home', 'my life', 'my kids',
  'kids', 'parents', 'my parents', 'god', 'coffee', 'music', 'nature', 'people', 'today', 'water', 'house',
])

/** A one-word or very general entry, which gets a gentle nudge to be specific. */
export function isGeneric(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[.!]+$/, '')
  if (!t) return false
  return GENERIC.has(t) || (t.split(/\s+/).length === 1 && t.length <= 12)
}

const CLOSING: Record<Branch, string[]> = {
  normal: [
    'Rest well. You noticed good things today.',
    'Let the day settle. The good parts are kept.',
    'That is today, held gently. Sleep well.',
    'Good things noticed. Time to rest.',
  ],
  low: [
    'Hard days count too. Rest now.',
    'You made room for today, even a hard one. Sleep gently.',
    'Not every day is easy. You still showed up.',
  ],
  veryLow: [
    'You showed up tonight. That is enough.',
    'Be gentle with yourself tonight. Tomorrow is a new day.',
    'Put it down for now. You can rest.',
  ],
}

/** One calm line to end the night, matched to the mood. */
export function closingLine(mood: Mood | null, date: string): string {
  const lines = CLOSING[moodBranch(mood)]
  let h = 0
  for (const c of date) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return lines[h % lines.length]
}
